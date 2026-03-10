import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { decrypt } from '../../smtp/route';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';

// POST /api/followups/process
// No enrollment needed — auto-finds leads by sent_at + delay_hours
// Header: x-api-key: sk-...
export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 });

        const { data: keyRow } = await supabase
            .from('api_keys').select('user_id').eq('key', apiKey).single();
        if (!keyRow) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

        const userId = keyRow.user_id;

        // 1. Get SMTP + AI settings
        const { data: settings } = await supabase
            .from('smtp_settings').select('*').eq('user_id', userId).single();

        if (!settings) return NextResponse.json({ error: 'No settings configured. Go to /followups to set up SMTP and AI.' }, { status: 400 });

        let smtpPassword = '';
        let openaiKey = '';
        try { smtpPassword = decrypt(settings.smtp_password); } catch { smtpPassword = settings.smtp_password; }
        try { openaiKey = decrypt(settings.openai_api_key); } catch { openaiKey = settings.openai_api_key; }

        if (!openaiKey) return NextResponse.json({ error: 'No OpenAI API key configured. Add it in /followups settings.' }, { status: 400 });

        // 2. Get all active sequences for this user
        const { data: sequences } = await supabase
            .from('followup_sequences')
            .select('id, name, send_interval_minutes, followup_steps(*)')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (!sequences?.length) return NextResponse.json({ message: 'No active sequences', processed: 0 });

        // 3. Setup clients once
        const transporter = nodemailer.createTransport({
            host: settings.smtp_host,
            port: settings.smtp_port,
            secure: settings.smtp_port === 465,
            auth: { user: settings.smtp_username, pass: smtpPassword },
        });
        const openai = new OpenAI({ apiKey: openaiKey });

        let processed = 0;
        const errors: string[] = [];

        for (const sequence of sequences) {
            const steps = ((sequence.followup_steps as unknown) as Array<{
                id: string; step_number: number; delay_hours: number; subject: string; ai_prompt: string;
            }>)?.sort((a, b) => a.step_number - b.step_number) ?? [];

            for (const step of steps) {
                // 4. Find all leads that are due for this step:
                //    sent_at + delay_hours <= NOW, AND no followup_log yet for this lead+sequence+step
                const cutoff = new Date(Date.now() - step.delay_hours * 3600 * 1000).toISOString();

                const { data: leads } = await supabase
                    .from('leads')
                    .select('id, full_name, company_name, email, website, email_content, sent_at')
                    .eq('user_id', userId)
                    .eq('status', 'sent')
                    .lte('sent_at', cutoff);

                if (!leads?.length) continue;

                // 5. Filter out leads already processed for this step
                const { data: doneLogs } = await supabase
                    .from('followup_logs')
                    .select('lead_id')
                    .eq('sequence_id', sequence.id)
                    .eq('step_number', step.step_number)
                    .in('lead_id', leads.map(l => l.id));

                const doneIds = new Set((doneLogs ?? []).map(l => l.lead_id));
                const dueleads = leads.filter(l => !doneIds.has(l.id));

                for (const lead of dueleads) {
                    try {
                        // 6. Build AI prompt with variable substitution
                        const prompt = step.ai_prompt
                            .replace(/\{\{name\}\}/g, lead.full_name ?? '')
                            .replace(/\{\{company\}\}/g, lead.company_name ?? '')
                            .replace(/\{\{email\}\}/g, lead.email ?? '')
                            .replace(/\{\{website\}\}/g, lead.website ?? '');

                        // 7. Generate AI email
                        const completion = await openai.chat.completions.create({
                            model: settings.ai_model || 'gpt-4o-mini',
                            messages: [
                                { role: 'system', content: 'You are an expert B2B email copywriter. Write only the email body. Be concise, professional, and personalized. No subject line.' },
                                { role: 'user', content: prompt },
                            ],
                            max_tokens: 300,
                        });
                        const emailContent = completion.choices[0]?.message?.content ?? '';

                        // 8. Send via SMTP
                        const subject = step.subject
                            .replace(/\{\{name\}\}/g, lead.full_name ?? '')
                            .replace(/\{\{company\}\}/g, lead.company_name ?? '');

                        await transporter.sendMail({
                            from: `"${settings.sender_name}" <${settings.sender_email}>`,
                            to: lead.email,
                            subject,
                            text: emailContent,
                        });

                        // 9. Log the sent follow-up
                        await supabase.from('followup_logs').insert({
                            lead_id: lead.id,
                            sequence_id: sequence.id,
                            step_number: step.step_number,
                            status: 'sent',
                            email_content: emailContent,
                            sent_at: new Date().toISOString(),
                            scheduled_at: cutoff,
                        });

                        processed++;
                    } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : String(err);
                        errors.push(`Lead ${lead.email} Step ${step.step_number}: ${msg}`);
                        try {
                            await supabase.from('followup_logs').insert({
                                lead_id: lead.id,
                                sequence_id: sequence.id,
                                step_number: step.step_number,
                                status: 'failed',
                                error: msg,
                                sent_at: new Date().toISOString(),
                            });
                        } catch { /* ignore log failure */ }
                    }
                }
            }
        }

        return NextResponse.json({ success: true, processed, errors });
    } catch (err) {
        console.error('POST /api/followups/process error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

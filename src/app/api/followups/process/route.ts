import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { decrypt } from '../../smtp/route';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';

// POST /api/followups/process — called by n8n cron every N minutes
// Header: x-api-key: sk-...
export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 });

        const { data: keyRow } = await supabase
            .from('api_keys')
            .select('user_id')
            .eq('key', apiKey)
            .single();

        if (!keyRow) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

        const userId = keyRow.user_id;

        // 1. Get SMTP settings for this user
        const { data: smtpData } = await supabase
            .from('smtp_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!smtpData) {
            return NextResponse.json({ error: 'No SMTP settings configured' }, { status: 400 });
        }

        let smtpPassword = '';
        try { smtpPassword = decrypt(smtpData.smtp_password); } catch { smtpPassword = smtpData.smtp_password; }

        // 2. Get active sequence for this user + its send_interval
        const { data: sequences } = await supabase
            .from('followup_sequences')
            .select('id, send_interval_minutes')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (!sequences?.length) {
            return NextResponse.json({ message: 'No active sequences', processed: 0 });
        }

        const sequenceIds = sequences.map((s) => s.id);
        const now = new Date().toISOString();

        // 3. Find pending logs due to be sent (scheduled_at <= now)
        const { data: dueLogs } = await supabase
            .from('followup_logs')
            .select(`
        id, lead_id, sequence_id, step_number,
        leads(full_name, company_name, email, website, email_content),
        followup_sequences(send_interval_minutes),
        followup_steps(subject, ai_prompt, delay_hours)
      `)
            .in('sequence_id', sequenceIds)
            .eq('status', 'pending')
            .lte('scheduled_at', now)
            .order('scheduled_at', { ascending: true })
            .limit(10);

        if (!dueLogs?.length) {
            return NextResponse.json({ message: 'No follow-ups due', processed: 0 });
        }

        // 4. Setup nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: smtpData.smtp_host,
            port: smtpData.smtp_port,
            secure: smtpData.smtp_port === 465,
            auth: { user: smtpData.smtp_username, pass: smtpPassword },
        });

        // 5. Setup OpenAI client
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        let processed = 0;
        const errors: string[] = [];

        for (const log of dueLogs) {
            try {
                type LeadData = { full_name: string; company_name: string; email: string; website: string; email_content: string };
                type StepData = { subject: string; ai_prompt: string };
                type SeqData = { send_interval_minutes: number };
                const lead = (log.leads as unknown) as LeadData | null;
                const step = (log.followup_steps as unknown) as StepData | null;
                const sequence = (log.followup_sequences as unknown) as SeqData | null;

                if (!lead || !step) continue;

                // Replace template variables in prompt
                const prompt = step.ai_prompt
                    .replace(/{{name}}/g, lead.full_name ?? '')
                    .replace(/{{company}}/g, lead.company_name ?? '')
                    .replace(/{{email}}/g, lead.email ?? '')
                    .replace(/{{website}}/g, lead.website ?? '');

                // 6. Generate AI email
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are an expert email copywriter. Write only the email body — no subject line, no greetings template, directly reply-worthy in a professional yet friendly tone.' },
                        { role: 'user', content: prompt },
                    ],
                    max_tokens: 250,
                });

                const emailContent = completion.choices[0]?.message?.content ?? '';

                // 7. Send email via SMTP
                await transporter.sendMail({
                    from: `"${smtpData.sender_name}" <${smtpData.sender_email}>`,
                    to: lead.email,
                    subject: step.subject
                        .replace(/{{name}}/g, lead.full_name ?? '')
                        .replace(/{{company}}/g, lead.company_name ?? ''),
                    text: emailContent,
                });

                // 8. Update log status
                await supabase
                    .from('followup_logs')
                    .update({ status: 'sent', email_content: emailContent, sent_at: new Date().toISOString() })
                    .eq('id', log.id);

                processed++;

                // 9. Respect send_interval between each email
                const intervalMs = (sequence?.send_interval_minutes ?? 5) * 60 * 1000;
                if (processed < dueLogs.length) {
                    await new Promise((resolve) => setTimeout(resolve, Math.min(intervalMs, 30000))); // cap at 30s in serverless
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`Log ${log.id}: ${msg}`);
                await supabase
                    .from('followup_logs')
                    .update({ status: 'failed', error: msg })
                    .eq('id', log.id);
            }
        }

        return NextResponse.json({ success: true, processed, errors });
    } catch (err) {
        console.error('POST /api/followups/process error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

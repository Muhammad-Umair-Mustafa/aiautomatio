import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/followups/enroll — called from n8n after first email is sent
// Header: x-api-key: sk-...
// Body: { lead_id, sequence_id }
export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 });

        // Validate API key
        const { data: keyRow } = await supabase
            .from('api_keys')
            .select('user_id')
            .eq('key', apiKey)
            .single();

        if (!keyRow) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

        const { lead_id, sequence_id } = await request.json();
        if (!lead_id || !sequence_id) {
            return NextResponse.json({ error: 'lead_id and sequence_id are required' }, { status: 422 });
        }

        // Verify lead belongs to this user
        const { data: lead } = await supabase
            .from('leads')
            .select('id, sent_at')
            .eq('id', lead_id)
            .eq('user_id', keyRow.user_id)
            .single();

        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        // Fetch all steps for the sequence
        const { data: steps } = await supabase
            .from('followup_steps')
            .select('*')
            .eq('sequence_id', sequence_id)
            .order('step_number', { ascending: true });

        if (!steps?.length) {
            return NextResponse.json({ error: 'Sequence has no steps' }, { status: 400 });
        }

        // Check if already enrolled
        const { data: existing } = await supabase
            .from('followup_logs')
            .select('id')
            .eq('lead_id', lead_id)
            .eq('sequence_id', sequence_id)
            .limit(1);

        if (existing?.length) {
            return NextResponse.json({ message: 'Already enrolled', enrolled: false });
        }

        // Create a pending log entry for each step
        const baseSentAt = lead.sent_at ? new Date(lead.sent_at) : new Date();
        const logs = steps.map((step) => {
            const scheduledAt = new Date(baseSentAt);
            scheduledAt.setHours(scheduledAt.getHours() + step.delay_hours);
            return {
                lead_id,
                sequence_id,
                step_number: step.step_number,
                status: 'pending',
                scheduled_at: scheduledAt.toISOString(),
            };
        });

        const { error } = await supabase.from('followup_logs').insert(logs);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true, enrolled: true, steps_scheduled: logs.length }, { status: 201 });
    } catch (err) {
        console.error('POST /api/followups/enroll error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

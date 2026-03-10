import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

type Params = { params: Promise<{ id: string }> };

// GET /api/sequences/[id]/steps
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: steps, error } = await client
            .from('followup_steps')
            .select('*')
            .eq('sequence_id', id)
            .order('step_number', { ascending: true });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ steps });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/sequences/[id]/steps — add or update a step
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id: sequence_id } = await params;
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { step_number, delay_hours, subject, ai_prompt } = await request.json();

        const { data, error } = await client
            .from('followup_steps')
            .upsert(
                { sequence_id, step_number, delay_hours, subject, ai_prompt },
                { onConflict: 'sequence_id,step_number' }
            )
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ step: data }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/sequences/[id]/steps — delete a step by step_number
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id: sequence_id } = await params;
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { step_number } = await request.json();
        const { error } = await client
            .from('followup_steps')
            .delete()
            .eq('sequence_id', sequence_id)
            .eq('step_number', step_number);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

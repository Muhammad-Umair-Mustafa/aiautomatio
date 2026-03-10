import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

type Params = { params: Promise<{ id: string }> };

// GET /api/sequences/[id] — sequence + steps
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: sequence, error } = await client
            .from('followup_sequences')
            .select('*, followup_steps(*)')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !sequence) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ sequence });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/sequences/[id] — update sequence
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { error } = await client
            .from('followup_sequences')
            .update(body)
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/sequences/[id] — delete sequence
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await client
            .from('followup_sequences')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

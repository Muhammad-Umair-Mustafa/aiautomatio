import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
    try {
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: sequences, error } = await client
            .from('followup_sequences')
            .select('*, followup_steps(count)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('GET /api/sequences error:', error);
            // Return empty array instead of 500 so UI doesn't crash
            return NextResponse.json({ sequences: [], error: error.message });
        }

        return NextResponse.json({ sequences: sequences ?? [] });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ sequences: [], error: 'Internal server error' });
    }
}

export async function POST(request: NextRequest) {
    try {
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name, send_interval_minutes } = await request.json();
        if (!name) return NextResponse.json({ error: 'name is required' }, { status: 422 });

        const { data, error } = await client
            .from('followup_sequences')
            .insert({ user_id: user.id, name, send_interval_minutes: send_interval_minutes ?? 5 })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ sequence: data }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

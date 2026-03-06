import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const serverClient = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await serverClient.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { data: lead, error } = await serverClient
            .from('leads')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)  // ensure users can only see their own leads
            .single();

        if (error || !lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json({ lead });
    } catch (err) {
        console.error('GET /api/leads/[id] error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

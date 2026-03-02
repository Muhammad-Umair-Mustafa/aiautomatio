import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: lead, error } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('id', id)
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

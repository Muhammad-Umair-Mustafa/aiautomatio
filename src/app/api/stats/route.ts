import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
    try {
        const serverClient = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await serverClient.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: stats, error: statsError } = await serverClient
            .from('email_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

        const { count: totalLeads } = await serverClient
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (statsError) {
            return NextResponse.json({
                total_sent: 0,
                sent_today: 0,
                sent_this_week: 0,
                last_sent_at: null,
                total_leads: totalLeads ?? 0,
            });
        }

        return NextResponse.json({ ...stats, total_leads: totalLeads ?? 0 });
    } catch (err) {
        console.error('GET /api/stats error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: stats, error: statsError } = await supabase
            .from('email_stats')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (statsError) {
            const { count: totalLeads } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true });

            return NextResponse.json({
                total_sent: 0,
                sent_today: 0,
                sent_this_week: 0,
                last_sent_at: null,
                total_leads: totalLeads ?? 0,
            });
        }

        const { count: totalLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            ...stats,
            total_leads: totalLeads ?? 0,
        });
    } catch (err) {
        console.error('GET /api/stats error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

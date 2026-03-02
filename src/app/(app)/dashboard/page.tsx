'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    MailCheck, Mail, Calendar, Users, Clock, Zap,
} from 'lucide-react';
import Topbar from '@/components/layout/topbar';
import StatCard from '@/components/dashboard/stat-card';
import EmailChart from '@/components/dashboard/email-chart';
import RecentLeads from '@/components/dashboard/recent-leads';
import { format, subDays, parseISO } from 'date-fns';
import { formatRelative } from '@/lib/utils-date';
import type { Lead } from '@/types';

interface Stats {
    total_sent: number;
    sent_today: number;
    sent_this_week: number;
    last_sent_at: string | null;
    total_leads: number;
}

interface ChartPoint {
    date: string;
    sent: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [chart, setChart] = useState<ChartPoint[]>([]);
    const [recent, setRecent] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const buildChartData = useCallback((leads: Lead[]): ChartPoint[] => {
        const days: Record<string, number> = {};
        for (let i = 13; i >= 0; i--) {
            const d = format(subDays(new Date(), i), 'MMM d');
            days[d] = 0;
        }
        leads.forEach((l) => {
            if (!l.sent_at) return;
            try {
                const d = format(parseISO(l.sent_at), 'MMM d');
                if (d in days) days[d]++;
            } catch { /* skip */ }
        });
        return Object.entries(days).map(([date, sent]) => ({ date, sent }));
    }, []);

    useEffect(() => {
        async function load() {
            try {
                const [statsRes, leadsRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/leads?pageSize=100'),
                ]);
                const statsData = await statsRes.json();
                const leadsData = await leadsRes.json();

                setStats(statsData);
                setChart(buildChartData(leadsData.leads ?? []));
                setRecent((leadsData.leads ?? []).slice(0, 5));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [buildChartData]);

    return (
        <div className="flex flex-col min-h-full">
            <Topbar
                title="Dashboard"
                subtitle="Overview of your outreach campaigns"
            />

            <div className="flex-1 p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
                    <StatCard
                        title="Total Emails Sent"
                        value={stats?.total_sent ?? 0}
                        icon={MailCheck}
                        iconColor="text-emerald-500"
                        loading={loading}
                    />
                    <StatCard
                        title="Sent Today"
                        value={stats?.sent_today ?? 0}
                        icon={Mail}
                        iconColor="text-blue-500"
                        loading={loading}
                    />
                    <StatCard
                        title="Sent This Week"
                        value={stats?.sent_this_week ?? 0}
                        icon={Calendar}
                        iconColor="text-violet-500"
                        loading={loading}
                    />
                    <StatCard
                        title="Total Leads"
                        value={stats?.total_leads ?? 0}
                        icon={Users}
                        iconColor="text-amber-500"
                        loading={loading}
                    />
                    <StatCard
                        title="Last Email Sent"
                        value={stats?.last_sent_at ? formatRelative(stats.last_sent_at) : '—'}
                        icon={Clock}
                        iconColor="text-rose-500"
                        loading={loading}
                    />
                </div>

                {/* Chart + Recent Leads */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                    <div className="xl:col-span-3">
                        <EmailChart data={chart} />
                    </div>
                    <div className="xl:col-span-2">
                        <RecentLeads leads={recent} loading={loading} />
                    </div>
                </div>

                {/* Webhook Info Banner */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">n8n Webhook Ready</p>
                        <p className="text-xs text-muted-foreground truncate">
                            POST to: <code className="font-mono bg-muted px-1 rounded">/api/leads</code>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

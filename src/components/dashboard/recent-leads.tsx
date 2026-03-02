'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils-date';
import { getStatusColor } from '@/lib/utils-date';
import type { Lead } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight } from 'lucide-react';

interface RecentLeadsProps {
    leads: Lead[];
    loading?: boolean;
}

export default function RecentLeads({ leads, loading = false }: RecentLeadsProps) {
    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Recent Leads</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 bg-muted rounded w-24" />
                                <div className="h-2.5 bg-muted rounded w-32" />
                            </div>
                            <div className="h-5 w-12 bg-muted rounded" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Leads</CardTitle>
                <Link href="/outreach" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    View all <ArrowUpRight className="w-3 h-3" />
                </Link>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0">
                {leads.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        No leads yet. Connect your n8n webhook.
                    </div>
                ) : (
                    leads.map((lead) => (
                        <Link
                            key={lead.id}
                            href={`/outreach/${lead.id}`}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0 uppercase">
                                {lead.full_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                    {lead.full_name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">{lead.email}</p>
                            </div>
                            <div className="shrink-0 text-right space-y-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(lead.status)}`}>
                                    {lead.status}
                                </span>
                                <p className="text-[10px] text-muted-foreground">{formatDate(lead.sent_at)}</p>
                            </div>
                        </Link>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

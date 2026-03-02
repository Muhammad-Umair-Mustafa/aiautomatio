'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import Topbar from '@/components/layout/topbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate, getStatusColor } from '@/lib/utils-date';
import type { Lead, LeadsResponse } from '@/types';
import { useDebounce } from '@/hooks/use-debounce';

export default function OutreachPage() {
    const router = useRouter();
    const [data, setData] = useState<LeadsResponse | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const debouncedSearch = useDebounce(search, 350);

    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: '20',
                search: debouncedSearch,
            });
            const res = await fetch(`/api/leads?${params}`);
            const json: LeadsResponse = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    const leads = data?.leads ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.totalPages ?? 1;

    return (
        <div className="flex flex-col min-h-full">
            <Topbar
                title="Outreach"
                subtitle={`${total.toLocaleString()} total lead${total !== 1 ? 's' : ''}`}
            />

            <div className="flex-1 p-6 space-y-4">
                {/* Search */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, company…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-border/60">
                                <TableHead className="font-semibold text-xs uppercase tracking-wide">Contact</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Company</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Campaign</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide">Status</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide hidden sm:table-cell">Date Sent</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="space-y-1.5 animate-pulse">
                                                <div className="h-3 bg-muted rounded w-28" />
                                                <div className="h-2.5 bg-muted rounded w-36" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-5 bg-muted rounded w-12 animate-pulse" />
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                ))
                            ) : leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                                        {search ? 'No leads match your search.' : 'No leads yet. Connect your n8n webhook.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leads.map((lead: Lead) => (
                                    <TableRow
                                        key={lead.id}
                                        className="cursor-pointer hover:bg-muted/40 transition-colors group"
                                        onClick={() => router.push(`/outreach/${lead.id}`)}
                                    >
                                        <TableCell>
                                            <div>
                                                <p className="text-sm font-medium group-hover:text-primary transition-colors truncate max-w-[180px]">
                                                    {lead.full_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                    {lead.email}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                            {lead.company_name || '—'}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                            {lead.campaign_name || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                            {formatDate(lead.sent_at)}
                                        </TableCell>
                                        <TableCell>
                                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Page {page} of {totalPages} · {total.toLocaleString()} leads
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || loading}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Building2, Mail, Phone, Globe, Calendar,
    User, Tag, FileText, Loader2
} from 'lucide-react';
import Topbar from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDateTime, getStatusColor } from '@/lib/utils-date';
import type { Lead } from '@/types';

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value?: string | null;
}) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/70 shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-sm text-foreground mt-0.5 break-words">{value}</p>
            </div>
        </div>
    );
}

export default function LeadDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/leads/${id}`);
                if (!res.ok) throw new Error('Not found');
                const { lead } = await res.json();
                setLead(lead);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-full">
                <Topbar title="Lead Detail" />
                <div className="flex items-center justify-center flex-1">
                    <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !lead) {
        return (
            <div className="flex flex-col min-h-full">
                <Topbar title="Lead Not Found" />
                <div className="flex flex-col items-center justify-center flex-1 gap-4">
                    <p className="text-muted-foreground">This lead doesn&apos;t exist.</p>
                    <Button onClick={() => router.push('/outreach')} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Outreach
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full">
            <Topbar title={lead.full_name} subtitle={lead.company_name ?? undefined} />

            <div className="flex-1 p-6">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* Back button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/outreach')}
                        className="text-muted-foreground hover:text-foreground -ml-1"
                    >
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        Back to Outreach
                    </Button>

                    {/* Header card */}
                    <Card>
                        <CardContent className="p-5 flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-base uppercase shrink-0">
                                    {lead.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">{lead.full_name}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {[lead.company_name, lead.email].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(lead.status)}`}>
                                {lead.status}
                            </span>
                        </CardContent>
                    </Card>

                    {/* Grid: Contact + Campaign */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Contact Info */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5 pb-4 divide-y divide-border">
                                <InfoRow icon={Mail} label="Email" value={lead.email} />
                                <InfoRow icon={Phone} label="Phone" value={lead.phone} />
                                <InfoRow icon={Building2} label="Company" value={lead.company_name} />
                                <InfoRow icon={Globe} label="Website" value={lead.website} />
                            </CardContent>
                        </Card>

                        {/* Campaign Info */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-muted-foreground" />
                                    Campaign Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5 pb-4 divide-y divide-border">
                                <InfoRow icon={Tag} label="Campaign" value={lead.campaign_name} />
                                <InfoRow icon={Calendar} label="Sent At" value={formatDateTime(lead.sent_at)} />
                                <InfoRow icon={Calendar} label="Created At" value={formatDateTime(lead.created_at)} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Email Content */}
                    {lead.email_content && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    Email Content Sent
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5 pb-5">
                                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                                    {lead.email_content}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

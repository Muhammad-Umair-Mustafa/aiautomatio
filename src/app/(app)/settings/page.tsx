'use client';

import { useState } from 'react';
import { Copy, Check, Zap, Key, Globe } from 'lucide-react';
import Topbar from '@/components/layout/topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
        </Button>
    );
}

export default function SettingsPage() {
    const webhookUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/leads`
        : '/api/leads';

    const examplePayload = JSON.stringify({
        full_name: "John Smith",
        company_name: "Acme Corp",
        email: "john@acme.com",
        phone: "+1 555 0100",
        website: "https://acme.com",
        email_content: "Hi John, I wanted to reach out about...",
        campaign_name: "Q1 Outreach 2024",
        status: "sent",
        sent_at: new Date().toISOString(),
    }, null, 2);

    return (
        <div className="flex flex-col min-h-full">
            <Topbar title="Settings" subtitle="Configure your dashboard and n8n integration" />

            <div className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-4">

                    {/* Webhook Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" />
                                n8n Webhook Configuration
                            </CardTitle>
                            <CardDescription>
                                Use this endpoint in your n8n workflow to push lead data into the dashboard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Endpoint URL */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                    <Globe className="w-3 h-3" /> Webhook Endpoint
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={webhookUrl}
                                        readOnly
                                        className="font-mono text-xs bg-muted"
                                    />
                                    <CopyButton text={webhookUrl} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Method: <code className="font-mono bg-muted px-1 rounded">POST</code> · Content-Type: <code className="font-mono bg-muted px-1 rounded">application/json</code>
                                </p>
                            </div>

                            <Separator />

                            {/* Example Payload */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Example JSON Payload
                                    </label>
                                    <CopyButton text={examplePayload} />
                                </div>
                                <pre className="rounded-lg border bg-muted/50 p-4 text-xs font-mono overflow-x-auto leading-relaxed text-foreground">
                                    {examplePayload}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Field Reference */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Key className="w-4 h-4 text-primary" />
                                Field Reference
                            </CardTitle>
                            <CardDescription>Required and optional fields for the webhook payload.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-0 divide-y divide-border">
                                {[
                                    { field: 'full_name', type: 'string', required: true, desc: 'Full name of the contact' },
                                    { field: 'email', type: 'string', required: true, desc: 'Email address (must be valid)' },
                                    { field: 'company_name', type: 'string', required: false, desc: 'Company or organization name' },
                                    { field: 'phone', type: 'string', required: false, desc: 'Phone number' },
                                    { field: 'website', type: 'string (URL)', required: false, desc: 'Company website URL' },
                                    { field: 'email_content', type: 'string', required: false, desc: 'The email body that was sent' },
                                    { field: 'campaign_name', type: 'string', required: false, desc: 'Campaign identifier or name' },
                                    { field: 'status', type: 'enum', required: false, desc: 'sent | pending | failed | replied' },
                                    { field: 'sent_at', type: 'ISO 8601', required: false, desc: 'Timestamp when email was sent' },
                                ].map(({ field, type, required, desc }) => (
                                    <div key={field} className="flex items-start gap-3 py-2.5">
                                        <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                                            {field}
                                        </code>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-foreground">{desc}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {type} · {required ? <span className="text-rose-500">required</span> : 'optional'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* N8N Integration Guide */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">How to Connect n8n</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-3 text-sm text-muted-foreground list-none">
                                {[
                                    'In your n8n workflow, after sending an email, add an HTTP Request node.',
                                    'Set the method to POST and paste the webhook URL above.',
                                    'Set content-type header to application/json.',
                                    'Map your workflow fields to the JSON body using the field reference above.',
                                    'Test with a single lead, then check the Outreach page to confirm data appears.',
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

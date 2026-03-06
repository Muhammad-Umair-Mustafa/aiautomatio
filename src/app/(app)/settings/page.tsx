'use client';

import { useEffect, useState } from 'react';
import {
    Copy, Check, Zap, Key, Globe, Eye, EyeOff,
    RefreshCw, Loader2, AlertTriangle,
} from 'lucide-react';
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
        toast.success('Copied!');
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
    const [apiKey, setApiKey] = useState('');
    const [keyName, setKeyName] = useState('');
    const [loading, setLoading] = useState(true);
    const [regen, setRegen] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const webhookUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/leads`
        : '/api/leads';

    useEffect(() => {
        fetch('/api/keys')
            .then((r) => r.json())
            .then(({ keys }) => {
                if (keys?.length) {
                    setApiKey(keys[0].key);
                    setKeyName(keys[0].name);
                }
            })
            .catch(() => toast.error('Failed to load API key'))
            .finally(() => setLoading(false));
    }, []);

    async function handleRegenerate() {
        if (!confirming) { setConfirming(true); return; }
        setRegen(true);
        setConfirming(false);
        try {
            const res = await fetch('/api/keys', { method: 'POST' });
            const { key } = await res.json();
            setApiKey(key.key);
            setShowKey(true);
            toast.success('New API key generated!');
        } catch {
            toast.error('Failed to regenerate key');
        } finally {
            setRegen(false);
        }
    }

    const maskedKey = apiKey
        ? apiKey.slice(0, 7) + '•'.repeat(Math.max(0, apiKey.length - 11)) + apiKey.slice(-4)
        : '';

    const n8nExample = JSON.stringify({
        full_name: "{{ $('Google Sheets').item.json.Name }}",
        company_name: "{{ $('Google Sheets').item.json.Company }}",
        email: "{{ $('Google Sheets').item.json.Email }}",
        phone: "{{ $('Google Sheets').item.json.Phone }}",
        website: "{{ $('Google Sheets').item.json.Website }}",
        email_content: "{{ $('Google Sheets').item.json['Personalized Email'] }}",
        campaign_name: "Q1 Outreach 2024",
        status: "sent",
        sent_at: "{{$now}}",
    }, null, 2);

    return (
        <div className="flex flex-col min-h-full">
            <Topbar title="Settings" subtitle="API key and n8n integration" />

            <div className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-4">

                    {/* API Key Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Key className="w-4 h-4 text-primary" />
                                Your API Key
                            </CardTitle>
                            <CardDescription>
                                Add this as an <code className="font-mono bg-muted px-1 rounded text-xs">x-api-key</code> header in your n8n HTTP Request node.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading key…
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">API Key</label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={showKey ? apiKey : maskedKey}
                                                readOnly
                                                className="font-mono text-xs bg-muted"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 shrink-0"
                                                onClick={() => setShowKey(!showKey)}
                                            >
                                                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </Button>
                                            <CopyButton text={apiKey} />
                                        </div>
                                    </div>

                                    {/* Regenerate */}
                                    <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-400 flex-1">
                                            {confirming
                                                ? 'Are you sure? This will break your existing n8n webhooks.'
                                                : 'Regenerating your key will invalidate the current one.'}
                                        </p>
                                        <div className="flex gap-2 shrink-0">
                                            {confirming && (
                                                <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRegenerate}
                                                disabled={regen}
                                                className={confirming ? 'border-red-400 text-red-600 hover:bg-red-50' : ''}
                                            >
                                                {regen
                                                    ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Generating…</>
                                                    : confirming
                                                        ? 'Yes, regenerate'
                                                        : <><RefreshCw className="w-3 h-3 mr-1" />Regenerate</>}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Webhook Config */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" />
                                n8n Webhook Setup
                            </CardTitle>
                            <CardDescription>Configure your HTTP Request node in n8n.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                    <Globe className="w-3 h-3" /> Webhook URL
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input value={webhookUrl} readOnly className="font-mono text-xs bg-muted" />
                                    <CopyButton text={webhookUrl} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="rounded-lg border bg-muted/40 p-3 space-y-0.5">
                                    <p className="font-medium text-foreground">Method</p>
                                    <p className="font-mono text-muted-foreground">POST</p>
                                </div>
                                <div className="rounded-lg border bg-muted/40 p-3 space-y-0.5">
                                    <p className="font-medium text-foreground">Header</p>
                                    <p className="font-mono text-muted-foreground">x-api-key: {maskedKey || 'your-key'}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">n8n JSON Body</label>
                                    <CopyButton text={n8nExample} />
                                </div>
                                <pre className="rounded-lg border bg-muted/50 p-4 text-xs font-mono overflow-x-auto leading-relaxed text-foreground">
                                    {n8nExample}
                                </pre>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Setup Steps</p>
                                <ol className="space-y-2 text-sm text-muted-foreground">
                                    {[
                                        'In n8n, add an HTTP Request node after your Send Email node.',
                                        'Set Method to POST and paste the webhook URL above.',
                                        'Under Headers, add: Key = x-api-key, Value = your API key.',
                                        'Set Body to JSON and paste the body template above.',
                                        'Map your Google Sheets columns to the fields.',
                                        'Test — data will appear in your Dashboard instantly.',
                                    ].map((step, i) => (
                                        <li key={i} className="flex gap-3">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

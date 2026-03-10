'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Plus, Trash2, ChevronDown, ChevronUp, Save, Loader2,
    Wifi, WifiOff, Sparkles, Copy, Check, Mail, Server,
    ToggleLeft, ToggleRight, Play, Key, Brain,
} from 'lucide-react';
import Topbar from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────
interface Settings {
    smtp_host: string; smtp_port: number; smtp_username: string; smtp_password: string;
    sender_email: string; sender_name: string; openai_api_key: string; ai_model: string;
}
interface Step { id?: string; step_number: number; delay_hours: number; subject: string; ai_prompt: string; }
interface Sequence { id: string; name: string; send_interval_minutes: number; is_active: boolean; }

const AI_MODELS = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
    { value: 'gpt-4o', label: 'GPT-4o (Best Quality)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Legacy)' },
];

const INTERVALS = [1, 3, 5, 10, 30];
const VARS = ['{{name}}', '{{company}}', '{{email}}', '{{website}}'];
const EXAMPLE_PROMPT = `Write a short, friendly follow-up email to {{name}} from {{company}}. Reference our previous outreach and ask if they had a chance to review it. Keep it under 80 words, no fluff.`;
const DEFAULT_SETTINGS: Settings = { smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password: '', sender_email: '', sender_name: '', openai_api_key: '', ai_model: 'gpt-4o-mini' };

// ─── Section 1: SMTP + AI Settings ────────────────────────────────────
function SettingsSection() {
    const [form, setForm] = useState<Settings>(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [smtpStatus, setSmtpStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

    useEffect(() => {
        fetch('/api/smtp').then(r => r.json()).then(({ settings }) => {
            if (settings) setForm(prev => ({ ...prev, ...settings }));
        });
    }, []);

    async function handleSave() {
        setSaving(true);
        const res = await fetch('/api/smtp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        setSaving(false);
        if (res.ok) toast.success('Settings saved!');
        else toast.error('Failed to save');
    }

    async function handleTest() {
        setTesting(true); setSmtpStatus('idle');
        const res = await fetch('/api/smtp/test', { method: 'POST' });
        setTesting(false);
        if (res.ok) { setSmtpStatus('ok'); toast.success('SMTP connection successful!'); }
        else { setSmtpStatus('fail'); const { error } = await res.json(); toast.error(error || 'Connection failed'); }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Server className="w-4 h-4 text-primary" />SMTP & AI Settings</CardTitle>
                <CardDescription>Configure email sending and AI generation for follow-ups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* SMTP */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" />Email (SMTP)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {([['smtp_host', 'SMTP Host', 'text', 'smtp.gmail.com'], ['smtp_port', 'SMTP Port', 'number', '587'], ['smtp_username', 'Username', 'email', 'you@gmail.com'], ['smtp_password', 'Password', 'password', '••••••••'], ['sender_email', 'Sender Email', 'email', 'you@domain.com'], ['sender_name', 'Sender Name', 'text', 'Your Name']] as const).map(([key, label, type, ph]) => (
                            <div key={key} className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
                                <Input type={type} placeholder={ph} value={form[key as keyof Settings] as string}
                                    onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))} />
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleTest} disabled={testing} variant="outline" size="sm">
                        {testing ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Testing…</> : smtpStatus === 'ok' ? <><Wifi className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />Connected</> : smtpStatus === 'fail' ? <><WifiOff className="w-3.5 h-3.5 mr-1.5 text-red-500" />Failed</> : <><Wifi className="w-3.5 h-3.5 mr-1.5" />Test SMTP</>}
                    </Button>
                </div>

                <Separator />

                {/* AI */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Brain className="w-3 h-3" />AI Generation (OpenAI)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Key className="w-3 h-3" />OpenAI API Key</label>
                            <Input type="password" placeholder="sk-..." value={form.openai_api_key}
                                onChange={e => setForm(p => ({ ...p, openai_api_key: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Model</label>
                            <select value={form.ai_model} onChange={e => setForm(p => ({ ...p, ai_model: e.target.value }))}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                                {AI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={saving} size="sm">
                    {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save All Settings</>}
                </Button>
            </CardContent>
        </Card>
    );
}

// ─── Step Card ────────────────────────────────────────────────────────
function StepCard({ step, onChange, onDelete, isLast }: { step: Step; onChange: (s: Step) => void; onDelete: () => void; isLast: boolean }) {
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{step.step_number}</div>
                {!isLast && <div className="w-px flex-1 bg-border my-1" />}
            </div>
            <Card className="flex-1 mb-3">
                <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Follow-up {step.step_number}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delay (hours after 1st email)</label>
                            <Input type="number" min={1} value={step.delay_hours}
                                onChange={e => onChange({ ...step, delay_hours: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject Line</label>
                            <Input placeholder="Re: {{company}}, quick follow-up" value={step.subject}
                                onChange={e => onChange({ ...step, subject: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Prompt</label>
                        <Textarea rows={3} placeholder={EXAMPLE_PROMPT} value={step.ai_prompt}
                            onChange={e => onChange({ ...step, ai_prompt: e.target.value })} className="text-sm resize-none" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Sequence Card ────────────────────────────────────────────────────
function SequenceCard({ seq, onDelete, onUpdate, apiKey }: { seq: Sequence; onDelete: () => void; onUpdate: (s: Sequence) => void; apiKey: string }) {
    const [open, setOpen] = useState(false);
    const [steps, setSteps] = useState<Step[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [name, setName] = useState(seq.name);
    const [interval, setInterval] = useState(seq.send_interval_minutes);

    async function toggleOpen() {
        if (open) { setOpen(false); return; }
        setLoading(true); setOpen(true);
        const res = await fetch(`/api/sequences/${seq.id}/steps`);
        const { steps: s } = await res.json();
        setSteps((s ?? []).sort((a: Step, b: Step) => a.step_number - b.step_number));
        setLoading(false);
    }

    function addStep() {
        const next = steps.length + 1;
        setSteps(p => [...p, { step_number: next, delay_hours: next * 24, subject: '', ai_prompt: '' }]);
    }

    async function saveSequence() {
        setSaving(true);
        // Save sequence meta
        await fetch(`/api/sequences/${seq.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, send_interval_minutes: interval }) });
        // Save each step
        for (const step of steps) {
            await fetch(`/api/sequences/${seq.id}/steps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(step),
            });
        }
        // Reload steps from server to get real IDs
        const res = await fetch(`/api/sequences/${seq.id}/steps`);
        const { steps: fresh } = await res.json();
        setSteps((fresh ?? []).sort((a: Step, b: Step) => a.step_number - b.step_number));
        setSaving(false);
        onUpdate({ ...seq, name, send_interval_minutes: interval });
        toast.success('Sequence saved!');
    }

    async function toggleActive() {
        await fetch(`/api/sequences/${seq.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !seq.is_active }) });
        onUpdate({ ...seq, is_active: !seq.is_active });
    }

    async function runNow() {
        if (!apiKey) { toast.error('Copy your API key from Settings first'); return; }
        setRunning(true);
        const res = await fetch('/api/followups/process', { method: 'POST', headers: { 'x-api-key': apiKey } });
        const data = await res.json();
        setRunning(false);
        if (data.processed > 0) toast.success(`Sent ${data.processed} follow-up${data.processed > 1 ? 's' : ''}!`);
        else toast.info(data.message || 'No follow-ups due right now');
        if (data.errors?.length) toast.error(`${data.errors.length} error(s). Check logs.`);
    }

    return (
        <Card className={cn('transition-all', seq.is_active ? 'border-primary/30' : 'opacity-60')}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button onClick={toggleActive} className="shrink-0 transition-transform hover:scale-110">
                            {seq.is_active ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                        </button>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{seq.name}</p>
                            <p className="text-xs text-muted-foreground">{seq.is_active ? 'Active' : 'Paused'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={runNow} disabled={running}>
                            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                            {running ? 'Running…' : 'Run Now'}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleOpen}>
                            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {open && (
                <CardContent className="space-y-4 pt-0 border-t">
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sequence Name</label>
                            <Input value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Send Interval (min)</label>
                            <select value={interval} onChange={e => setInterval(Number(e.target.value))}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                                {INTERVALS.map(v => <option key={v} value={v}>{v} minute{v > 1 ? 's' : ''}</option>)}
                            </select>
                        </div>
                    </div>
                    <Separator />
                    {loading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
                    ) : (
                        <div className="space-y-0">
                            {steps.length === 0 && <p className="text-sm text-muted-foreground py-2">No steps yet. Add your first follow-up below.</p>}
                            {steps.map((step, idx) => (
                                <StepCard key={`${step.id ?? idx}`} step={step} isLast={idx === steps.length - 1}
                                    onChange={s => setSteps(p => p.map((x, i) => i === idx ? s : x))}
                                    onDelete={() => setSteps(p => p.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 })))} />
                            ))}
                            <Button variant="outline" size="sm" onClick={addStep} className="w-full border-dashed mt-2">
                                <Plus className="w-3.5 h-3.5 mr-1.5" />Add Follow-up Step
                            </Button>
                        </div>
                    )}
                    <div className="flex justify-end pt-2">
                        <Button size="sm" onClick={saveSequence} disabled={saving}>
                            {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save Sequence</>}
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

// ─── AI Prompt Helper ─────────────────────────────────────────────────
function AiSection() {
    const [copied, setCopied] = useState(false);
    async function copyPrompt() {
        await navigator.clipboard.writeText(EXAMPLE_PROMPT);
        setCopied(true); toast.success('Copied!');
        setTimeout(() => setCopied(false), 2000);
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />AI Prompt Variables</CardTitle>
                <CardDescription>Use these in your step prompts — filled with real lead data per send.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    {VARS.map(v => <code key={v} className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-mono font-medium border border-primary/20">{v}</code>)}
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Example Prompt</label>
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={copyPrompt}>
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                    </div>
                    <pre className="rounded-lg border bg-muted/50 p-3 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap">{EXAMPLE_PROMPT}</pre>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function FollowupsPage() {
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [apiKey, setApiKey] = useState('');

    // Load API key from /api/keys for the Run Now button
    useEffect(() => {
        fetch('/api/keys').then(r => r.json()).then(({ keys }) => {
            if (keys?.[0]) setApiKey(keys[0].key);
        });
    }, []);

    const loadSequences = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/sequences');
        const { sequences: s, error } = await res.json();
        if (error && !s?.length) toast.error(`Sequences: ${error}. Make sure to run migration_followups.sql in Supabase.`);
        setSequences(s ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { loadSequences(); }, [loadSequences]);

    async function createSequence() {
        if (!newName.trim()) return;
        setCreating(true);
        const res = await fetch('/api/sequences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
        const { sequence, error } = await res.json();
        if (error) { toast.error(error); setCreating(false); return; }
        setSequences(p => [sequence, ...p]);
        setNewName(''); setCreating(false); setShowForm(false);
        toast.success('Sequence created!');
    }

    return (
        <div className="flex flex-col min-h-full">
            <Topbar title="Follow-ups" subtitle="Automated follow-up email sequences" />
            <div className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-4">

                    <SettingsSection />

                    {/* Sequences */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />Follow-up Sequences</CardTitle>
                                    <CardDescription>Automatically picks leads that received first email and sends follow-ups on schedule.</CardDescription>
                                </div>
                                <Button size="sm" onClick={() => setShowForm(p => !p)}><Plus className="w-3.5 h-3.5 mr-1.5" />New</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {showForm && (
                                <div className="flex gap-2 p-3 rounded-lg border bg-muted/30">
                                    <Input placeholder="e.g. Q2 Cold Outreach Follow-ups" value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && createSequence()} />
                                    <Button onClick={createSequence} disabled={creating} size="sm">
                                        {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
                                    </Button>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
                            ) : sequences.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No sequences yet. Create one above.</p>
                                    <p className="text-xs mt-1">Remember to run <code className="font-mono bg-muted px-1 rounded">migration_followups.sql</code> in Supabase first.</p>
                                </div>
                            ) : sequences.map(seq => (
                                <SequenceCard key={seq.id} seq={seq} apiKey={apiKey}
                                    onDelete={async () => {
                                        await fetch(`/api/sequences/${seq.id}`, { method: 'DELETE' });
                                        setSequences(p => p.filter(s => s.id !== seq.id));
                                        toast.success('Deleted');
                                    }}
                                    onUpdate={updated => setSequences(p => p.map(s => s.id === updated.id ? updated : s))} />
                            ))}
                        </CardContent>
                    </Card>

                    <AiSection />

                    {/* How it works */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">⚡ How Auto Follow-ups Work</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <ol className="space-y-2 list-none">
                                {[
                                    'Your n8n workflow sends the first email and posts the lead to /api/leads.',
                                    'Configure a sequence with steps (e.g. Step 1: 24h delay, Step 2: 48h).',
                                    'Press "Run Now" on a sequence — or set up a 5-min n8n cron to call POST /api/followups/process with your x-api-key header.',
                                    'The system automatically picks ALL leads whose sent_at was 24h+ ago (or 48h+ for step 2), generates a personalized AI email, and sends it.',
                                    'Each lead is tracked in followup_logs — no duplicate sends.',
                                ].map((s, i) => (
                                    <li key={i} className="flex gap-3">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                                        <span>{s}</span>
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

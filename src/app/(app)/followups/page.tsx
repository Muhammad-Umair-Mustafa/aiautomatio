'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Plus, Trash2, ChevronDown, ChevronUp, Save, Loader2,
    Wifi, WifiOff, ArrowRight, Clock, Sparkles, Copy, Check,
    Mail, Server, ToggleLeft, ToggleRight,
} from 'lucide-react';
import Topbar from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────
interface SmtpSettings { smtp_host: string; smtp_port: number; smtp_username: string; smtp_password: string; sender_email: string; sender_name: string; }
interface Step { id?: string; step_number: number; delay_hours: number; subject: string; ai_prompt: string; }
interface Sequence { id: string; name: string; send_interval_minutes: number; is_active: boolean; steps?: Step[]; }

const DEFAULT_SMTP: SmtpSettings = { smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password: '', sender_email: '', sender_name: '' };
const INTERVALS = [1, 3, 5, 10, 30];
const VARS = ['{{name}}', '{{company}}', '{{email}}', '{{website}}'];
const EXAMPLE_PROMPT = `Write a short, friendly follow-up email to {{name}} from {{company}}. Reference our previous outreach and ask if they had a chance to review it. Keep it under 80 words, no fluff.`;

// ─── Section 1: SMTP ─────────────────────────────────────────────────
function SmtpSection() {
    const [form, setForm] = useState<SmtpSettings>(DEFAULT_SMTP);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

    useEffect(() => {
        fetch('/api/smtp').then(r => r.json()).then(({ settings }) => {
            if (settings) setForm({ ...settings, smtp_password: '' });
        });
    }, []);

    async function handleSave() {
        setSaving(true);
        const res = await fetch('/api/smtp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        setSaving(false);
        if (res.ok) toast.success('SMTP settings saved!');
        else toast.error('Failed to save settings');
    }

    async function handleTest() {
        setTesting(true); setStatus('idle');
        const res = await fetch('/api/smtp/test', { method: 'POST' });
        setTesting(false);
        if (res.ok) { setStatus('ok'); toast.success('SMTP connection successful!'); }
        else { setStatus('fail'); const { error } = await res.json(); toast.error(error || 'Connection failed'); }
    }

    const field = (key: keyof SmtpSettings, label: string, type = 'text', placeholder = '') => (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
            <Input type={type} placeholder={placeholder} value={form[key] as string} onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))} />
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Server className="w-4 h-4 text-primary" />SMTP Settings</CardTitle>
                <CardDescription>Configure the email account used to send follow-ups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {field('smtp_host', 'SMTP Host', 'text', 'smtp.gmail.com')}
                    {field('smtp_port', 'SMTP Port', 'number', '587')}
                    {field('smtp_username', 'SMTP Username', 'text', 'you@gmail.com')}
                    {field('smtp_password', 'SMTP Password', 'password', '••••••••')}
                    {field('sender_email', 'Sender Email', 'email', 'you@yourdomain.com')}
                    {field('sender_name', 'Sender Name', 'text', 'Your Name')}
                </div>
                <div className="flex items-center gap-3 pt-1">
                    <Button onClick={handleSave} disabled={saving} size="sm">
                        {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save Settings</>}
                    </Button>
                    <Button onClick={handleTest} disabled={testing} variant="outline" size="sm">
                        {testing ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Testing…</> : status === 'ok' ? <><Wifi className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />Connected</> : status === 'fail' ? <><WifiOff className="w-3.5 h-3.5 mr-1.5 text-red-500" />Failed</> : <><Wifi className="w-3.5 h-3.5 mr-1.5" />Test Connection</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Step Card ───────────────────────────────────────────────────────
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
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Clock className="w-3 h-3" />Delay (hours)</label>
                            <Input type="number" min={1} value={step.delay_hours} onChange={e => onChange({ ...step, delay_hours: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject Line</label>
                            <Input placeholder="Re: {{name}}, quick follow-up" value={step.subject} onChange={e => onChange({ ...step, subject: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Prompt</label>
                        <Textarea rows={3} placeholder={EXAMPLE_PROMPT} value={step.ai_prompt} onChange={e => onChange({ ...step, ai_prompt: e.target.value })} className="text-sm resize-none" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Sequence Card ────────────────────────────────────────────────────
function SequenceCard({ seq, onDelete, onUpdate }: { seq: Sequence; onDelete: () => void; onUpdate: (s: Sequence) => void }) {
    const [open, setOpen] = useState(false);
    const [steps, setSteps] = useState<Step[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState(seq.name);
    const [interval, setInterval] = useState(seq.send_interval_minutes);

    async function loadSteps() {
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

    function updateStep(idx: number, step: Step) { setSteps(p => p.map((s, i) => i === idx ? step : s)); }
    function removeStep(idx: number) { setSteps(p => p.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 }))); }

    async function saveSequence() {
        setSaving(true);
        // Save sequence meta
        await fetch(`/api/sequences/${seq.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, send_interval_minutes: interval }) });
        // Save each step
        for (const step of steps) {
            if (step.subject && step.ai_prompt) {
                await fetch(`/api/sequences/${seq.id}/steps`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(step) });
            }
        }
        setSaving(false);
        onUpdate({ ...seq, name, send_interval_minutes: interval });
        toast.success('Sequence saved!');
    }

    async function toggleActive() {
        await fetch(`/api/sequences/${seq.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !seq.is_active }) });
        onUpdate({ ...seq, is_active: !seq.is_active });
    }

    return (
        <Card className={cn('transition-all', seq.is_active ? 'border-primary/30' : 'opacity-70')}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button onClick={toggleActive} className="shrink-0 transition-transform hover:scale-110">
                            {seq.is_active
                                ? <ToggleRight className="w-5 h-5 text-primary" />
                                : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                        </button>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{seq.name}</p>
                            <p className="text-xs text-muted-foreground">Every {seq.send_interval_minutes}m · {seq.is_active ? 'Active' : 'Paused'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadSteps}>
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />Loading steps…
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {steps.length === 0 && (
                                <p className="text-sm text-muted-foreground py-2">No steps yet. Add your first follow-up below.</p>
                            )}
                            {steps.map((step, idx) => (
                                <StepCard key={idx} step={step} isLast={idx === steps.length - 1}
                                    onChange={s => updateStep(idx, s)} onDelete={() => removeStep(idx)} />
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

// ─── Section 3: AI Prompt Helper ──────────────────────────────────────
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
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />AI Prompt Guide</CardTitle>
                <CardDescription>Use these variables in your prompts. AI generates a unique email per lead.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {VARS.map(v => (
                        <code key={v} className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-mono font-medium border border-primary/20">{v}</code>
                    ))}
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
                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p className="font-semibold">💡 Tips for great AI prompts</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                        <li>Specify word count (e.g. &quot;under 80 words&quot;)</li>
                        <li>Mention tone (friendly, professional, casual)</li>
                        <li>Reference the previous email context</li>
                        <li>End with a clear CTA (book a call, reply, etc.)</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function FollowupsPage() {
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [loadingSeqs, setLoadingSeqs] = useState(true);
    const [newSeqName, setNewSeqName] = useState('');
    const [creating, setCreating] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);

    const loadSequences = useCallback(async () => {
        setLoadingSeqs(true);
        const res = await fetch('/api/sequences');
        const { sequences: s } = await res.json();
        setSequences(s ?? []);
        setLoadingSeqs(false);
    }, []);

    useEffect(() => { loadSequences(); }, [loadSequences]);

    async function createSequence() {
        if (!newSeqName.trim()) return;
        setCreating(true);
        const res = await fetch('/api/sequences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSeqName }) });
        const { sequence } = await res.json();
        setSequences(p => [sequence, ...p]);
        setNewSeqName(''); setCreating(false); setShowNewForm(false);
        toast.success('Sequence created!');
    }

    async function deleteSequence(id: string) {
        await fetch(`/api/sequences/${id}`, { method: 'DELETE' });
        setSequences(p => p.filter(s => s.id !== id));
        toast.success('Sequence deleted');
    }

    return (
        <div className="flex flex-col min-h-full">
            <Topbar title="Follow-ups" subtitle="Automated email sequences" />
            <div className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-4">

                    {/* Section 1: SMTP */}
                    <SmtpSection />

                    {/* Section 2: Sequence Builder */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />Follow-up Sequences</CardTitle>
                                    <CardDescription>Build automated email sequences for your leads.</CardDescription>
                                </div>
                                <Button size="sm" onClick={() => setShowNewForm(p => !p)}>
                                    <Plus className="w-3.5 h-3.5 mr-1.5" />New Sequence
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {showNewForm && (
                                <div className="flex gap-2 p-3 rounded-lg border bg-muted/30">
                                    <Input placeholder="Sequence name (e.g. Q2 Cold Outreach)" value={newSeqName}
                                        onChange={e => setNewSeqName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && createSequence()} />
                                    <Button onClick={createSequence} disabled={creating} size="sm">
                                        {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
                                    </Button>
                                </div>
                            )}

                            {loadingSeqs ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                                    <Loader2 className="w-4 h-4 animate-spin" />Loading sequences…
                                </div>
                            ) : sequences.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No sequences yet. Create your first one above.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sequences.map(seq => (
                                        <SequenceCard key={seq.id} seq={seq}
                                            onDelete={() => deleteSequence(seq.id)}
                                            onUpdate={updated => setSequences(p => p.map(s => s.id === updated.id ? updated : s))} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Section 3: AI Guide */}
                    <AiSection />

                    {/* Section 4: n8n Integration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary" />n8n Integration</CardTitle>
                            <CardDescription>Connect Follow-up Automation to your n8n workflow.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="space-y-3">
                                <p className="font-medium text-foreground text-xs uppercase tracking-wide text-muted-foreground">Step 1 — Enroll a lead after first email</p>
                                <pre className="rounded-lg border bg-muted/50 p-3 text-xs font-mono overflow-x-auto">{`POST /api/followups/enroll
x-api-key: sk-your-key
Content-Type: application/json

{
  "lead_id": "uuid-of-the-lead",
  "sequence_id": "uuid-of-your-sequence"
}`}</pre>
                                <p className="text-xs text-muted-foreground">Add this HTTP Request node in n8n AFTER you send the first email and record the lead.</p>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <p className="font-medium text-foreground text-xs uppercase tracking-wide text-muted-foreground">Step 2 — Process queue (n8n Cron every 5 min)</p>
                                <pre className="rounded-lg border bg-muted/50 p-3 text-xs font-mono overflow-x-auto">{`POST /api/followups/process
x-api-key: sk-your-key`}</pre>
                                <p className="text-xs text-muted-foreground">Set up a Schedule Trigger in n8n → every 5 minutes → HTTP Request to this endpoint.</p>
                            </div>

                            <Separator />

                            <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 p-3 text-xs text-amber-700 dark:text-amber-400">
                                <p className="font-semibold mb-1">⚠️ Required: OpenAI API Key</p>
                                <p>Add <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">OPENAI_API_KEY</code> to your Vercel environment variables for AI generation to work.</p>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

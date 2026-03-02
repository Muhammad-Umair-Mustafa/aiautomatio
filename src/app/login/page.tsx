'use client';

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        startTransition(async () => {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error('Invalid email or password');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.55_0.2_265/0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_left,oklch(0.65_0.22_265/0.12),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,oklch(0.55_0.2_265/0.05),transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0_0_0/0.04)_1px,transparent_1px)] [background-size:48px_48px] dark:bg-[linear-gradient(to_right,oklch(1_0_0/0.03)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.03)_1px,transparent_1px)]" />

            {/* Login Card */}
            <Card className="relative z-10 w-full max-w-sm shadow-xl border-border/60 bg-card/95 backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-4">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <Zap className="w-4.5 h-4.5" />
                        </div>
                        <span className="font-semibold text-base tracking-tight">AI Outreach</span>
                    </div>
                    <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
                    <CardDescription>Sign in to your dashboard</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="admin@yourdomain.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center mt-5">
                        Powered by AI Outreach Dashboard · MVP
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

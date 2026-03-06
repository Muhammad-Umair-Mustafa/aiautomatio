'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface TopbarProps {
    title: string;
    subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [email, setEmail] = useState<string>('');
    const [name, setName] = useState<string>('');

    useEffect(() => {
        void (async () => {
            const supabase = createSupabaseBrowserClient();
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                setEmail(data.user.email ?? '');
                const fullName = data.user.user_metadata?.full_name as string | undefined;
                setName(fullName ?? data.user.email ?? 'User');
            }
        })();
    }, []);

    async function handleSignOut() {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-6 border-b bg-background/80 backdrop-blur-md border-border">
            <div>
                <h1 className="text-sm font-semibold text-foreground">{title}</h1>
                {subtitle && (
                    <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 gap-2 px-2">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm hidden sm:inline-flex truncate max-w-[120px]">
                                {name || 'Loading…'}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <div className="px-2 py-1.5">
                            <p className="text-xs font-medium truncate">{email}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleSignOut}
                            className="text-red-500 focus:text-red-500 cursor-pointer"
                        >
                            <LogOut className="mr-2 h-3.5 w-3.5" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

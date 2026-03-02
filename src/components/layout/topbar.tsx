'use client';

import { signOut, useSession } from 'next-auth/react';
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

interface TopbarProps {
    title: string;
    subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();

    const initials = session?.user?.name
        ? session.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'AD';

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-6 border-b bg-background/80 backdrop-blur-md border-border">
            {/* Page title */}
            <div>
                <h1 className="text-sm font-semibold text-foreground">{title}</h1>
                {subtitle && (
                    <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>
                )}
            </div>

            {/* Right side */}
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
                            <span className="text-sm hidden sm:inline-flex">
                                {session?.user?.name || 'Admin'}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <div className="px-2 py-1.5">
                            <p className="text-xs font-medium truncate">{session?.user?.email}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => signOut({ callbackUrl: '/login' })}
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

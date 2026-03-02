'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Mail,
    Settings,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Outreach', href: '/outreach', icon: Mail },
    { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="flex flex-col w-60 min-h-screen border-r bg-[var(--sidebar-bg)] border-[var(--sidebar-border)] shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--sidebar-border)]">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <Zap className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm tracking-tight text-foreground">
                    AI Outreach
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {navItems.map(({ label, href, icon: Icon }) => {
                    const isActive =
                        href === '/dashboard'
                            ? pathname === '/dashboard' || pathname === '/'
                            : pathname.startsWith(href);

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                                isActive
                                    ? 'bg-primary/10 text-primary dark:bg-primary/15'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                            )}
                        >
                            <Icon
                                className={cn(
                                    'w-4 h-4 transition-colors',
                                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                )}
                            />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[var(--sidebar-border)]">
                <p className="text-xs text-muted-foreground">
                    AI Outreach Dashboard
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">v1.0 · MVP</p>
            </div>
        </aside>
    );
}

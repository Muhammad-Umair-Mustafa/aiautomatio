'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    iconColor?: string;
    trend?: string;
    loading?: boolean;
}

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor = 'text-primary',
    trend,
    loading = false,
}: StatCardProps) {
    if (loading) {
        return (
            <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md">
                <CardContent className="p-5">
                    <div className="animate-pulse space-y-3">
                        <div className="h-3 bg-muted rounded w-24" />
                        <div className="h-8 bg-muted rounded w-16" />
                        <div className="h-3 bg-muted rounded w-32" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group">
            {/* subtle top gradient */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                            {title}
                        </p>
                        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                        )}
                        {trend && (
                            <p className="text-xs font-medium text-emerald-500">{trend}</p>
                        )}
                    </div>
                    <div className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 shrink-0 ml-3',
                        'group-hover:scale-110 transition-transform duration-200'
                    )}>
                        <Icon className={cn('w-5 h-5', iconColor)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

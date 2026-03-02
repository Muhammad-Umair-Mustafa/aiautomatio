import { format, formatDistanceToNow, isToday, isThisWeek, parseISO } from 'date-fns';

export function formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        return format(parseISO(date), 'MMM d, yyyy');
    } catch {
        return '—';
    }
}

export function formatDateTime(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        return format(parseISO(date), 'MMM d, yyyy · h:mm a');
    } catch {
        return '—';
    }
}

export function formatRelative(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        return formatDistanceToNow(parseISO(date), { addSuffix: true });
    } catch {
        return '—';
    }
}

export function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'sent': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'replied': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
        default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400';
    }
}

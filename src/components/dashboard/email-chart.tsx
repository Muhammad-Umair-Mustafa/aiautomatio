'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';

interface ChartDataPoint {
    date: string;
    sent: number;
}

interface EmailChartProps {
    data: ChartDataPoint[];
}

function CustomTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
                <p className="text-muted-foreground text-xs mb-1">{label}</p>
                <p className="font-semibold text-foreground">
                    {payload[0].value} <span className="font-normal text-muted-foreground">emails</span>
                </p>
            </div>
        );
    }
    return null;
}

export default function EmailChart({ data }: EmailChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    const gridColor = isDark ? 'oklch(0.25 0 0)' : 'oklch(0.92 0 0)';
    const axisColor = isDark ? 'oklch(0.45 0 0)' : 'oklch(0.65 0 0)';

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Email Activity (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                        No email activity yet
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: axisColor, fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fill: axisColor, fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="sent"
                                stroke="oklch(0.6 0.22 265)"
                                strokeWidth={2}
                                dot={{ fill: 'oklch(0.6 0.22 265)', strokeWidth: 0, r: 3 }}
                                activeDot={{ r: 5, fill: 'oklch(0.6 0.22 265)', strokeWidth: 2, stroke: 'white' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

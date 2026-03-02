import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

// Zod schema for validation
const leadSchema = z.object({
    full_name: z.string().min(1, 'full_name is required'),
    company_name: z.string().optional(),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    email_content: z.string().optional(),
    campaign_name: z.string().optional(),
    status: z.enum(['sent', 'pending', 'failed', 'replied']).default('sent'),
    sent_at: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate
        const parsed = leadSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 422 }
            );
        }

        const data = parsed.data;

        // Insert lead
        const { data: lead, error: leadError } = await supabaseAdmin
            .from('leads')
            .insert({
                full_name: data.full_name,
                company_name: data.company_name || null,
                email: data.email,
                phone: data.phone || null,
                website: data.website || null,
                email_content: data.email_content || null,
                campaign_name: data.campaign_name || null,
                status: data.status,
                sent_at: data.sent_at || new Date().toISOString(),
            })
            .select()
            .single();

        if (leadError) {
            console.error('Supabase insert error:', leadError);
            return NextResponse.json(
                { error: 'Database error', details: leadError.message },
                { status: 500 }
            );
        }

        // Update email_stats using the DB function
        await supabaseAdmin.rpc('update_email_stats');

        return NextResponse.json({ success: true, lead }, { status: 201 });
    } catch (err) {
        console.error('POST /api/leads error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabaseAdmin
            .from('leads')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.or(
                `full_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%,campaign_name.ilike.%${search}%`
            );
        }

        const { data: leads, count, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const total = count ?? 0;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        return NextResponse.json({ leads, total, page, pageSize, totalPages });
    } catch (err) {
        console.error('GET /api/leads error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';

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

// Resolve API key → user_id (for n8n webhook calls)
async function getUserIdFromApiKey(key: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('key', key)
        .single();

    if (error || !data) return null;
    return data.user_id;
}

// POST /api/leads — called by n8n with x-api-key header
export async function POST(request: NextRequest) {
    try {
        // 1. Validate API key
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Missing x-api-key header' },
                { status: 401 }
            );
        }

        const userId = await getUserIdFromApiKey(apiKey);
        if (!userId) {
            return NextResponse.json(
                { error: 'Invalid API key' },
                { status: 401 }
            );
        }

        // 2. Parse and validate body
        const body = await request.json();
        const parsed = leadSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 422 }
            );
        }

        const data = parsed.data;

        // 3. Insert lead with user_id
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .insert({
                user_id: userId,
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

        // 4. Update email_stats for this user only
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();

        const [{ count: totalSent }, { count: sentToday }, { count: sentWeek }] = await Promise.all([
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'sent'),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'sent').gte('sent_at', todayStart),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'sent').gte('sent_at', weekStart),
        ]);

        await supabase.from('email_stats').upsert({
            user_id: userId,
            total_sent: totalSent ?? 0,
            sent_today: sentToday ?? 0,
            sent_this_week: sentWeek ?? 0,
            last_sent_at: data.sent_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        return NextResponse.json({ success: true, lead }, { status: 201 });
    } catch (err) {
        console.error('POST /api/leads error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/leads — for authenticated dashboard users
export async function GET(request: NextRequest) {
    try {
        const serverClient = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await serverClient.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = serverClient
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
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

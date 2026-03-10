import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-cbc';
const KEY = Buffer.from((process.env.NEXTAUTH_SECRET || 'fallback-secret-32-chars-padded!!').padEnd(32).slice(0, 32));

export function encrypt(text: string): string {
    if (!text) return '';
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGO, KEY, iv);
    const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + enc.toString('hex');
}

export function decrypt(text: string): string {
    if (!text || !text.includes(':')) return text;
    try {
        const [ivHex, encHex] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const enc = Buffer.from(encHex, 'hex');
        const decipher = createDecipheriv(ALGO, KEY, iv);
        return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    } catch { return text; }
}

// GET /api/smtp
export async function GET() {
    try {
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data } = await client.from('smtp_settings').select('*').eq('user_id', user.id).single();
        if (!data) return NextResponse.json({ settings: null });

        return NextResponse.json({
            settings: {
                ...data,
                smtp_password: data.smtp_password ? '••••••••' : '',
                openai_api_key: data.openai_api_key ? '••••••••' : '',
            },
        });
    } catch (err) {
        console.error('GET /api/smtp error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/smtp
export async function POST(request: NextRequest) {
    try {
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        const { data: existing } = await client
            .from('smtp_settings').select('smtp_password, openai_api_key').eq('user_id', user.id).single();

        const passwordToStore = body.smtp_password && body.smtp_password !== '••••••••'
            ? encrypt(body.smtp_password) : (existing?.smtp_password ?? '');

        const openaiKeyToStore = body.openai_api_key && body.openai_api_key !== '••••••••'
            ? encrypt(body.openai_api_key) : (existing?.openai_api_key ?? '');

        const { error } = await client.from('smtp_settings').upsert({
            user_id: user.id,
            smtp_host: body.smtp_host || '',
            smtp_port: body.smtp_port || 587,
            smtp_username: body.smtp_username || '',
            smtp_password: passwordToStore,
            sender_email: body.sender_email || '',
            sender_name: body.sender_name || '',
            openai_api_key: openaiKeyToStore,
            ai_model: body.ai_model || 'gpt-4o-mini',
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('POST /api/smtp error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

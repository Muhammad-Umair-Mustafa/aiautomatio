import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-cbc';
const KEY = Buffer.from((process.env.NEXTAUTH_SECRET || 'fallback-secret-32-chars-padded!!').padEnd(32).slice(0, 32));

export function encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGO, KEY, iv);
    const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + enc.toString('hex');
}

export function decrypt(text: string): string {
    const [ivHex, encHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = createDecipheriv(ALGO, KEY, iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

// GET /api/smtp — return settings (password masked)
export async function GET() {
    try {
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data } = await client
            .from('smtp_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!data) return NextResponse.json({ settings: null });

        return NextResponse.json({
            settings: { ...data, smtp_password: data.smtp_password ? '••••••••' : '' },
        });
    } catch (err) {
        console.error('GET /api/smtp error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/smtp — save/upsert settings
export async function POST(request: NextRequest) {
    try {
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { smtp_host, smtp_port, smtp_username, smtp_password, sender_email, sender_name } = body;

        // Fetch existing to preserve password if not changed
        const { data: existing } = await client
            .from('smtp_settings')
            .select('smtp_password')
            .eq('user_id', user.id)
            .single();

        const passwordToStore = smtp_password && smtp_password !== '••••••••'
            ? encrypt(smtp_password)
            : (existing?.smtp_password ?? '');

        const { error } = await client
            .from('smtp_settings')
            .upsert({
                user_id: user.id,
                smtp_host: smtp_host || '',
                smtp_port: smtp_port || 587,
                smtp_username: smtp_username || '',
                smtp_password: passwordToStore,
                sender_email: sender_email || '',
                sender_name: sender_name || '',
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('POST /api/smtp error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

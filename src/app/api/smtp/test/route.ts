import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { decrypt } from '../route';
import nodemailer from 'nodemailer';

export async function POST(_request: NextRequest) {
    try {
        const client = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: settings } = await client
            .from('smtp_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!settings) {
            return NextResponse.json({ error: 'No SMTP settings saved yet' }, { status: 400 });
        }

        let password = '';
        try { password = decrypt(settings.smtp_password); } catch { password = settings.smtp_password; }

        const transporter = nodemailer.createTransport({
            host: settings.smtp_host,
            port: settings.smtp_port,
            secure: settings.smtp_port === 465,
            auth: { user: settings.smtp_username, pass: password },
        });

        await transporter.verify();

        return NextResponse.json({ success: true, message: 'SMTP connection successful!' });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'SMTP connection failed';
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

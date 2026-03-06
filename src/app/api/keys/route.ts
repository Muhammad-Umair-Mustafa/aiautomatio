import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

function generateApiKey(): string {
    return 'sk-' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function ensureUserSetup(serverClient: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
    // Auto-create stats row if it doesn't exist
    await serverClient.from('email_stats').upsert(
        { user_id: userId, total_sent: 0, sent_today: 0, sent_this_week: 0 },
        { onConflict: 'user_id', ignoreDuplicates: true }
    );

    // Check if API key exists
    const { data: existing } = await serverClient
        .from('api_keys')
        .select('id, key, name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (existing && existing.length > 0) return existing;

    // Auto-create API key on first access
    const { data: newKeys } = await serverClient
        .from('api_keys')
        .insert({ user_id: userId, key: generateApiKey(), name: 'Default Key' })
        .select();

    return newKeys ?? [];
}

// GET /api/keys — return current user's API key (auto-creates on first visit)
export async function GET() {
    try {
        const serverClient = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await serverClient.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const keys = await ensureUserSetup(serverClient, user.id);
        return NextResponse.json({ keys });
    } catch (err) {
        console.error('GET /api/keys error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/keys — regenerate API key
export async function POST() {
    try {
        const serverClient = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await serverClient.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await serverClient.from('api_keys').delete().eq('user_id', user.id);

        const { data: keyRow, error } = await serverClient
            .from('api_keys')
            .insert({ user_id: user.id, key: generateApiKey(), name: 'Default Key' })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ key: keyRow });
    } catch (err) {
        console.error('POST /api/keys error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

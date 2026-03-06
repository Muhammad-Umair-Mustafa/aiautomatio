import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET /api/keys — return current user's API key
export async function GET() {
    try {
        const serverClient = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await serverClient.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: keys, error } = await serverClient
            .from('api_keys')
            .select('id, key, name, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ keys });
    } catch (err) {
        console.error('GET /api/keys error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/keys — regenerate API key (delete old, create new)
export async function POST() {
    try {
        const serverClient = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await serverClient.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete existing keys for this user
        await serverClient.from('api_keys').delete().eq('user_id', user.id);

        // Generate new key
        const newKey = 'sk-' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        const { data: keyRow, error } = await serverClient
            .from('api_keys')
            .insert({ user_id: user.id, key: newKey, name: 'Default Key' })
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

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url.startsWith('your_')) {
        // Return a dummy URL during build; real URL required at runtime
        return 'https://placeholder.supabase.co';
    }
    return url;
}

function getAnonKey(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
}

function getServiceKey(): string {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
}

// Client-side Supabase client (uses anon key)
export function getSupabase(): SupabaseClient {
    if (!_supabase) {
        _supabase = createClient(getSupabaseUrl(), getAnonKey());
    }
    return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        return Reflect.get(getSupabase(), prop, receiver);
    },
});

// Server-side Supabase client with service role (bypasses RLS)
export function getSupabaseAdmin(): SupabaseClient {
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(getSupabaseUrl(), getServiceKey(), {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        return Reflect.get(getSupabaseAdmin(), prop, receiver);
    },
});

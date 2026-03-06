// AuthProvider is no longer needed — Supabase SSR handles sessions via cookies.
// This file is kept as a passthrough to avoid breaking imports.
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

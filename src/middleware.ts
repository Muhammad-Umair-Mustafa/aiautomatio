import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Public routes - no auth required
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/leads') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/stats') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // Check JWT token
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

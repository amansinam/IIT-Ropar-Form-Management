import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            // Only check token exists — don't check role/portal here
            // Role is enforced in signIn callback and mapSession
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/login',
        },
    }
);

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/forms/:path*',
        '/users/:path*',
        '/members/:path*',
        '/activity/:path*',
        '/settings/:path*',
    ],
};
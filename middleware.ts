import createMiddleware from 'next-intl/middleware';
import { createClient } from '@/utils/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/settings';

// Auth pages that logged-in users shouldn't access
const authPages = ['/sign-in', '/sign-up', '/forgot-password'];

// Pages that require authentication
const protectedUrls = ['/quiz-builder'];

async function middleware(request: NextRequest) {
    // Create a response with intl middleware
    const intlMiddleware = createMiddleware({
        locales,
        defaultLocale,
        localePrefix: 'always'
    });

    const response = await intlMiddleware(request);

    // Create Supabase client
    const { supabase } = createClient(request);
    const { data: { session } } = await supabase.auth.getSession();

    // Check if the URL is a protected auth route
    const url = new URL(request.url);
    const pathWithoutLocale = '/' + url.pathname.split('/').slice(2).join('/');

    // Check for protected routes (must be logged in)
    const isProtectedRoute = protectedUrls.some(path => pathWithoutLocale.startsWith(path));
    if (isProtectedRoute && !session) {
        const locale = url.pathname.split('/')[1];
        return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
    }

    // Check for auth pages (must NOT be logged in)
    const isAuthPage = authPages.some(path => pathWithoutLocale.startsWith(path));
    if (isAuthPage && session) {
        const locale = url.pathname.split('/')[1];
        return NextResponse.redirect(new URL(`/${locale}/quiz-builder`, request.url));
    }

    return response;
}

export default middleware;

export const config = {
    matcher: ['/', '/(ar|en)/:path*']
}; 
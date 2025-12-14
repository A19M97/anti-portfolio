import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const isPublicRoute = createRouteMatcher([
  '/',
  '/:locale',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  // Route pubbliche per dashboard, profili e risultati
  '/:locale/dashboard',
  '/dashboard',
  '/:locale/users/:path*',
  '/users/:path*',
  '/:locale/simulations/:path*/results',
  '/simulations/:path*/results',
  '/api/feed',
  '/api/:path*'
]);

const intlMiddleware = createMiddleware(routing);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  if (request.nextUrl.pathname.startsWith('/api')) {
    console.log('Skipping intl middleware for API route:', request.nextUrl.pathname);
    return NextResponse.next();
  }

  // Run the intl middleware first
  const intlResponse = intlMiddleware(request);

  return intlResponse;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

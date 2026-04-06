import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Deprecated route map ─────────────────────────────────────────────────────
// Maps unversioned legacy paths to their /api/v1/ successors.
// Requests to these paths receive deprecation headers.
// They are NOT redirected yet (preserves UI compatibility).
// Once all UI callers are updated to use /api/v1/, replace with 308 redirects.

const DEPRECATED_ROUTES: Record<string, string> = {
  '/api/wallets':       '/api/v1/wallets',
  '/api/transfers':     '/api/v1/transfers',
  '/api/payments':      '/api/v1/payments',
  '/api/transactions':  '/api/v1/transactions',
  '/api/cards':         '/api/v1/payments', // cards are under payments in v1
};

const SUNSET_DATE = '2026-12-31';

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Unversioned API deprecation signals ───────────────────────────────────
  // Attach headers so API consumers know to migrate, without breaking anything.
  const matchedLegacyPath = Object.keys(DEPRECATED_ROUTES).find(
    (legacy) => pathname === legacy || pathname.startsWith(`${legacy}/`)
  );

  if (matchedLegacyPath) {
    const successor = DEPRECATED_ROUTES[matchedLegacyPath];
    const response = NextResponse.next();
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', SUNSET_DATE);
    response.headers.set('Link', `<${successor}>; rel="successor-version"`);
    return response;
  }

  // ── Auth guard for dashboard routes ───────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const accessToken = request.cookies.get('sb-access-token')?.value;

    if (!accessToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

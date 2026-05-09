/**
 * Session route unit tests
 *
 * Tests POST (set session), GET (retrieve / auto-refresh), and DELETE (clear).
 * Supabase getSession and fetch (token refresh) are mocked — no network calls.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/supabase-server', () => ({
  getSession: jest.fn(),
}));

// Populated in beforeEach after imports are resolved
let mockGetSession: jest.Mock;

// ── Imports ───────────────────────────────────────────────────────────────────

import { POST, GET, DELETE } from './route';
import { NextRequest } from 'next/server';
import * as supabaseServer from '@/lib/supabase-server';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(opts: {
  method?: string;
  body?: unknown;
  cookies?: Record<string, string>;
  url?: string;
}) {
  const url = opts.url ?? 'http://localhost/api/auth/session';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const init: any = { method: opts.method ?? 'GET' };
  if (opts.body) {
    init.body = JSON.stringify(opts.body);
    init.headers = { 'Content-Type': 'application/json' };
  }

  const req = new NextRequest(url, init);

  if (opts.cookies) {
    // NextRequest cookies are set via headers in test env
    const cookieHeader = Object.entries(opts.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => ({ value: opts.cookies![name] }),
      },
    });
  }

  return req;
}

function makeUser(id = 'user-001', email = 'test@example.com') {
  return { id, email };
}

// Wire up mockGetSession after module imports are resolved
beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession = supabaseServer.getSession as jest.Mock;
});

// ── POST /auth/session ────────────────────────────────────────────────────────

describe('POST /auth/session', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets access-token cookie and returns user on valid token', async () => {
    mockGetSession.mockResolvedValue(makeUser());

    const req = makeRequest({ method: 'POST', body: { accessToken: 'valid-token', refreshToken: 'refresh-token', expiresAt: Math.floor(Date.now() / 1000) + 3600 } });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.id).toBe('user-001');
    expect(body.user.email).toBe('test@example.com');
  });

  it('returns 401 when getSession returns null (invalid token)', async () => {
    mockGetSession.mockResolvedValue(null);

    const req = makeRequest({ method: 'POST', body: { accessToken: 'bad-token' } });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid access token');
  });

  it('returns 400 on missing accessToken', async () => {
    const req = makeRequest({ method: 'POST', body: { refreshToken: 'only-refresh' } });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid session payload');
  });

  it('returns 400 when body is not valid JSON shape', async () => {
    const req = makeRequest({ method: 'POST', body: {} });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('includes session.expiresAt in response', async () => {
    mockGetSession.mockResolvedValue(makeUser());
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    const req = makeRequest({ method: 'POST', body: { accessToken: 'tok', expiresAt } });
    const res = await POST(req);
    const body = await res.json();

    expect(body.session.expiresAt).toBe(expiresAt * 1000);
  });
});

// ── GET /auth/session ─────────────────────────────────────────────────────────

describe('GET /auth/session', () => {
  const SUPABASE_URL = 'https://test.supabase.co';
  const SUPABASE_ANON_KEY = 'anon-key';

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  });

  it('returns session null when no cookies are present', async () => {
    const req = new NextRequest('http://localhost/api/auth/session');
    Object.defineProperty(req, 'cookies', {
      value: { get: () => undefined },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.session).toBeNull();
  });

  it('returns user when access token is valid', async () => {
    mockGetSession.mockResolvedValue(makeUser());

    const req = new NextRequest('http://localhost/api/auth/session');
    Object.defineProperty(req, 'cookies', {
      value: { get: (name: string) => name === 'sb-access-token' ? { value: 'valid-token' } : undefined },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.id).toBe('user-001');
  });

  it('auto-refreshes when access token is expired but refresh token is valid', async () => {
    // Access token is invalid/expired
    mockGetSession.mockResolvedValue(null);

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        user: { id: 'user-002', email: 'refreshed@example.com' },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const req = new NextRequest('http://localhost/api/auth/session');
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => {
          if (name === 'sb-access-token') return { value: 'expired-token' };
          if (name === 'sb-refresh-token') return { value: 'valid-refresh-token' };
          return undefined;
        },
      },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.user.id).toBe('user-002');

    // Verify fetch was called with correct Supabase token URL
    expect(fetchMock).toHaveBeenCalledWith(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('uses refresh token when no access token cookie at all', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_in: 3600,
        user: { id: 'user-003', email: 'no-access@example.com' },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const req = new NextRequest('http://localhost/api/auth/session');
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => name === 'sb-refresh-token' ? { value: 'only-refresh' } : undefined,
      },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.user.email).toBe('no-access@example.com');
  });

  it('clears cookies and returns session null when both tokens are invalid', async () => {
    // Access token fails
    mockGetSession.mockResolvedValue(null);

    // Refresh token call fails
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'invalid_grant' }),
    }) as unknown as typeof fetch;

    const req = new NextRequest('http://localhost/api/auth/session');
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => {
          if (name === 'sb-access-token') return { value: 'bad-access' };
          if (name === 'sb-refresh-token') return { value: 'bad-refresh' };
          return undefined;
        },
      },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.session).toBeNull();
  });
});

// ── DELETE /auth/session ──────────────────────────────────────────────────────

describe('DELETE /auth/session', () => {
  it('returns success and clears auth cookies', async () => {
    const res = await DELETE();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Verify cookies are cleared (maxAge=0 means deletion)
    const setCookieHeaders = res.headers.getSetCookie?.() ?? [];
    const accessCookie = setCookieHeaders.find((h: string) => h.startsWith('sb-access-token'));
    const refreshCookie = setCookieHeaders.find((h: string) => h.startsWith('sb-refresh-token'));
    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
  });
});

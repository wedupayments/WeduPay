'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - WeduPay</title>
      </head>
      <body style={{ margin: 0, padding: '2rem', fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div style={{ maxWidth: 600, margin: '4rem auto', padding: '2rem', background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h1 style={{ color: '#0f172a', fontSize: 24 }}>Something went wrong</h1>
          <p style={{ color: '#475569' }}>{error.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={reset}
            style={{ background: '#11d473', color: '#0f172a', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  const checks = {
    supabaseConfigured: false,
    supabaseReachable: false,
    databaseReachable: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check if Supabase is configured
    checks.supabaseConfigured = !!(supabaseUrl && supabaseServiceKey && supabaseUrl.includes('supabase.co'));

    if (checks.supabaseConfigured) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Check if Supabase is reachable
      try {
        const { error } = await supabase.auth.getSession();
        checks.supabaseReachable = !error;
      } catch {
        checks.supabaseReachable = false;
      }

      // Check if database is reachable
      try {
        const { error } = await supabase.from('users').select('id').limit(1);
        checks.databaseReachable = !error;
      } catch {
        checks.databaseReachable = false;
      }
    }

    const allHealthy = checks.supabaseConfigured && checks.supabaseReachable && checks.databaseReachable;

    return NextResponse.json(
      {
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        checks,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Registration Debug Endpoint
 * 
 * Helps diagnose registration issues by checking:
 * - Environment variables
 * - Database connection
 * - Supabase connection
 * - Table schema
 * 
 * @endpoint GET /api/debug/registration
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
      canInitialize: false,
      canConnect: false,
      error: null as string | null,
    },
    database: {
      canQuery: false,
      usersTableExists: false,
      userCount: 0,
      error: null as string | null,
    },
  };

  // Test Supabase initialization
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      checks.supabase.canInitialize = true;

      // Test database connection
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        checks.database.error = error.message;
        checks.supabase.error = error.message;
      } else {
        checks.supabase.canConnect = true;
        checks.database.canQuery = true;
        checks.database.usersTableExists = true;
      }

      // Get user count
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (!countError && count !== null) {
        checks.database.userCount = count;
      }
    } else {
      checks.supabase.error = 'Missing Supabase credentials';
    }
  } catch (error) {
    checks.supabase.error = error instanceof Error ? error.message : 'Unknown error';
    checks.database.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // Determine overall status
  const allChecksPass = 
    checks.environment.hasSupabaseUrl &&
    checks.environment.hasSupabaseAnonKey &&
    checks.environment.hasSupabaseServiceKey &&
    checks.environment.hasDatabaseUrl &&
    checks.supabase.canInitialize &&
    checks.supabase.canConnect &&
    checks.database.canQuery &&
    checks.database.usersTableExists;

  return NextResponse.json({
    status: allChecksPass ? 'healthy' : 'unhealthy',
    checks,
    recommendations: getRecommendations(checks),
  });
}

function getRecommendations(checks: any): string[] {
  const recommendations: string[] = [];

  if (!checks.environment.hasSupabaseUrl) {
    recommendations.push('Set NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!checks.environment.hasSupabaseAnonKey) {
    recommendations.push('Set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  if (!checks.environment.hasSupabaseServiceKey) {
    recommendations.push('Set SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  if (!checks.environment.hasDatabaseUrl) {
    recommendations.push('Set DATABASE_URL environment variable');
  }

  if (!checks.supabase.canInitialize) {
    recommendations.push('Verify Supabase credentials are correct');
  }

  if (!checks.supabase.canConnect) {
    recommendations.push('Check Supabase project status and network connectivity');
  }

  if (!checks.database.usersTableExists) {
    recommendations.push('Run database migrations: npx prisma migrate deploy');
  }

  if (checks.database.error) {
    recommendations.push(`Database error: ${checks.database.error}`);
  }

  if (recommendations.length === 0) {
    recommendations.push('All checks passed! Registration should work correctly.');
  }

  return recommendations;
}

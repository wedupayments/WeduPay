/**
 * Sync Profile API
 * 
 * Manually triggers profile creation/sync for authenticated Supabase users
 * who don't have a WeduPay profile yet. Useful for fixing auth issues.
 * 
 * @endpoint POST /api/auth/sync-profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const syncSchema = z.object({
  phoneNumber: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[SyncProfileAPI] ${requestId} - Syncing profile`);

  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Verify token and get user
    const { data: { user: supabaseUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !supabaseUser) {
      console.error(`[SyncProfileAPI] ${requestId} - Auth error:`, authError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid authentication token',
        },
        { status: 401 }
      );
    }

    console.log(`[SyncProfileAPI] ${requestId} - User authenticated:`, supabaseUser.email);

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('supabaseUserId', supabaseUser.id)
      .single();

    if (existingProfile) {
      console.log(`[SyncProfileAPI] ${requestId} - Profile already exists`);
      return NextResponse.json(
        {
          success: true,
          user: existingProfile,
          message: 'Profile already exists',
        },
        { status: 200 }
      );
    }

    // Parse optional body data
    const body = await request.json().catch(() => ({}));
    const validation = syncSchema.safeParse(body);
    const { phoneNumber, country } = validation.success ? validation.data : {};

    // Try to create profile
    const createResponse = await fetch(`${request.nextUrl.origin}/api/auth/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email,
        phoneNumber: phoneNumber || supabaseUser.user_metadata?.phone_number,
        country: country || supabaseUser.user_metadata?.country,
      }),
    });

    const createResult = await createResponse.json();

    if (!createResponse.ok) {
      console.error(`[SyncProfileAPI] ${requestId} - Profile creation failed:`, createResult);
      
      // If missing data, return specific error
      if (createResult.code === 'MISSING_PROFILE_DATA') {
        return NextResponse.json(
          {
            success: false,
            error: 'Profile data incomplete',
            message: 'Please provide phoneNumber and country to complete your profile',
            code: 'MISSING_PROFILE_DATA',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: createResult.error || 'Failed to create profile',
        },
        { status: createResponse.status }
      );
    }

    console.log(`[SyncProfileAPI] ${requestId} - Profile synced successfully`);
    return NextResponse.json(
      {
        success: true,
        user: createResult.user,
        message: 'Profile synced successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[SyncProfileAPI] ${requestId} - Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync profile',
      },
      { status: 500 }
    );
  }
}

/**
 * Get User Profile API
 * 
 * Retrieves a user's profile by Supabase user ID or email.
 * Used by the auth service to fetch user data after authentication.
 * 
 * @endpoint GET /api/auth/user
 * 
 * @query {string} userId - Supabase auth user ID (optional)
 * @query {string} email - User's email address (optional)
 * 
 * @returns {Object} response
 * @returns {boolean} success - Whether the operation succeeded
 * @returns {Object} user - User profile data
 * @returns {string} error - Error message if failed
 * 
 * @example
 * // Request
 * GET /api/auth/user?userId=abc123-def456
 * 
 * // Response
 * {
 *   "success": true,
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "phoneNumber": "254712345678",
 *     "country": "KE",
 *     "kycStatus": "verified",
 *     "role": "USER"
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    // Validate that at least one identifier is provided
    if (!userId && !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId or email parameter is required',
        },
        { status: 400 }
      );
    }

    // Build query based on provided identifier
    let query = supabaseAdmin.from('users').select('*');

    if (userId) {
      query = query.eq('supabaseUserId', userId);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data: user, error } = await query.single();

    if (error || !user) {
      console.log(`[GetUserAPI] ${requestId} - User not found`);
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          country: user.country,
          kycStatus: user.kycStatus,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[GetUserAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user',
      },
      { status: 500 }
    );
  }
}

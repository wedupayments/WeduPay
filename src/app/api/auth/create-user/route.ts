/**
 * Create User Profile API
 * 
 * Creates a user profile in the database after successful Supabase auth registration.
 * This endpoint is called internally by the auth service.
 * 
 * @endpoint POST /api/auth/create-user
 * 
 * @body {Object} request
 * @body {string} request.supabaseUserId - Supabase auth user ID
 * @body {string} request.email - User's email address
 * @body {string} request.phoneNumber - User's phone number
 * @body {string} request.country - User's country code
 * 
 * @returns {Object} response
 * @returns {boolean} success - Whether the operation succeeded
 * @returns {Object} user - Created user profile
 * @returns {string} error - Error message if failed
 * 
 * @example
 * // Request
 * POST /api/auth/create-user
 * {
 *   "supabaseUserId": "abc123-def456",
 *   "email": "user@example.com",
 *   "phoneNumber": "254712345678",
 *   "country": "KE"
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "phoneNumber": "254712345678",
 *     "country": "KE",
 *     "kycStatus": "pending",
 *     "role": "USER"
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Request validation schema
 * Ensures all required fields are present and valid
 */
const createUserSchema = z.object({
  supabaseUserId: z.string().uuid('Invalid Supabase user ID'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number too short'),
  country: z.string().length(2, 'Country code must be 2 characters'),
});

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[CreateUserAPI] ${requestId} - Creating user profile`);

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      console.error(`[CreateUserAPI] ${requestId} - Validation failed:`, validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { supabaseUserId, email, phoneNumber, country } = validation.data;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('supabaseUserId', supabaseUserId)
      .single();

    if (existingUser) {
      console.log(`[CreateUserAPI] ${requestId} - User already exists: ${existingUser.email}`);
      return NextResponse.json(
        {
          success: true,
          user: existingUser,
          message: 'User already exists',
        },
        { status: 200 }
      );
    }

    // If the email already exists in the app DB, attach the Supabase user id
    // so seeded/demo accounts can be claimed by their verified Supabase login.
    const { data: duplicateEmail, error: duplicateEmailError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (duplicateEmailError && duplicateEmailError.code !== 'PGRST116') {
      throw duplicateEmailError;
    }

    if (duplicateEmail) {
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ supabaseUserId })
        .eq('id', duplicateEmail.id)
        .select()
        .single();

      if (updateError) {
        console.error(`[CreateUserAPI] ${requestId} - Failed linking existing email ${email}:`, updateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to link existing user profile',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            country: updatedUser.country,
            kycStatus: updatedUser.kycStatus,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
          },
          message: 'Existing user linked successfully',
        },
        { status: 200 }
      );
    }

    // Create user in database
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        supabaseUserId,
        email,
        phoneNumber,
        country,
        kycStatus: 'pending',
        role: 'USER',
      })
      .select()
      .single();

    if (createError) {
      console.error(`[CreateUserAPI] ${requestId} - Database error:`, createError);
      
      // Handle unique constraint violations
      if (createError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'User with this email or phone number already exists',
          },
          { status: 409 }
        );
      }

      throw createError;
    }

    console.log(`[CreateUserAPI] ${requestId} - User created successfully: ${newUser.id}`);

    // Create initial wallet for user (default USD wallet)
    await supabaseAdmin
      .from('wallets')
      .insert({
        userId: newUser.id,
        walletType: 'mobile_wallet',
        currency: 'USD',
        balance: 0,
      });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          country: newUser.country,
          kycStatus: newUser.kycStatus,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[CreateUserAPI] ${requestId} - Unexpected error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      },
      { status: 500 }
    );
  }
}

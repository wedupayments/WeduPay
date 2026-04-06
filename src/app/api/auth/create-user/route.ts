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
import { randomUUID } from 'crypto';

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
  phoneNumber: z.string().optional(),
  country: z.string().optional(),
  role: z.enum(['USER', 'MERCHANT', 'ADMIN']).optional(),
});

function normalizePhoneNumber(phoneNumber?: string): string | null {
  if (!phoneNumber) {
    return null;
  }

  const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  return /^\+?[1-9]\d{8,14}$/.test(normalizedPhone) ? normalizedPhone : null;
}

function normalizeCountry(country?: string): string | null {
  if (!country) {
    return null;
  }

  const normalizedCountry = country.trim().toUpperCase();
  const countryMap: Record<string, string> = {
    ZIMBABWE: 'ZW',
    KENYA: 'KE',
    NIGERIA: 'NG',
    GHANA: 'GH',
    UGANDA: 'UG',
    TANZANIA: 'TZ',
  };

  if (countryMap[normalizedCountry]) {
    return countryMap[normalizedCountry];
  }

  return /^[A-Z]{2}$/.test(normalizedCountry) ? normalizedCountry : null;
}

export function determineUserRole(email: string, requestedRole?: string): 'USER' | 'MERCHANT' | 'ADMIN' {
  if (email === 'admin@wedupay.test') {
    return 'ADMIN';
  }

  if (email === 'merchant@wedupay.test') {
    return 'MERCHANT';
  }

  if (requestedRole === 'MERCHANT' || requestedRole === 'ADMIN') {
    return requestedRole as 'USER' | 'MERCHANT' | 'ADMIN';
  }

  return 'USER';
}

export function resolveExistingUserRole(email: string, currentRole?: string | null, requestedRole?: string): 'USER' | 'MERCHANT' | 'ADMIN' {
  if (currentRole === 'ADMIN' || currentRole === 'MERCHANT') {
    return currentRole;
  }

  return determineUserRole(email, requestedRole);
}

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[CreateUserAPI] ${requestId} - Creating user profile`);

  try {
    // Verify Supabase client is initialized
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(`[CreateUserAPI] ${requestId} - Missing Supabase credentials`);
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: Missing Supabase credentials',
        },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log(`[CreateUserAPI] ${requestId} - Request body:`, { 
      supabaseUserId: body.supabaseUserId, 
      email: body.email,
      hasPhone: !!body.phoneNumber,
      hasCountry: !!body.country 
    });
    
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

    const { supabaseUserId, email, phoneNumber, country, role } = validation.data;
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const normalizedCountry = normalizeCountry(country);

    console.log(`[CreateUserAPI] ${requestId} - Normalized data:`, {
      email,
      normalizedPhone,
      normalizedCountry,
      role
    });

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, phoneNumber, country, role')
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
      console.error(`[CreateUserAPI] ${requestId} - Database error checking email:`, duplicateEmailError);
      throw duplicateEmailError;
    }

    if (duplicateEmail) {
      console.log(`[CreateUserAPI] ${requestId} - Linking existing email profile: ${email}`);
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          supabaseUserId,
          role: resolveExistingUserRole(email, duplicateEmail.role, role),
        })
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

      console.log(`[CreateUserAPI] ${requestId} - Successfully linked profile for: ${email}`);
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

    if (!normalizedPhone || !normalizedCountry) {
      console.warn(`[CreateUserAPI] ${requestId} - Missing required fields for new profile: phone=${!!normalizedPhone}, country=${!!normalizedCountry}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Phone number and 2-letter country code are required to create a new profile',
          code: 'MISSING_PROFILE_DATA',
        },
        { status: 400 }
      );
    }

    // Create user in database
    console.log(`[CreateUserAPI] ${requestId} - Attempting to insert user:`, {
      supabaseUserId,
      email,
      phoneNumber: normalizedPhone,
      country: normalizedCountry,
      kycStatus: 'pending',
      role: determineUserRole(email, role),
    });

    const userId = randomUUID(); // Generate UUID explicitly

    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId, // Explicitly set the ID
        supabaseUserId,
        email,
        phoneNumber: normalizedPhone,
        country: normalizedCountry,
        kycStatus: 'pending',
        role: determineUserRole(email, role),
      })
      .select()
      .single();

    if (createError) {
      console.error(`[CreateUserAPI] ${requestId} - Database error:`, {
        message: createError.message,
        code: createError.code,
        details: createError.details,
        hint: createError.hint,
      });
      
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

      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${createError.message}`,
          code: createError.code,
        },
        { status: 500 }
      );
    }

    console.log(`[CreateUserAPI] ${requestId} - User created successfully: ${newUser.id}`);

    // Create initial wallet for user (default USD wallet)
    console.log(`[CreateUserAPI] ${requestId} - Creating initial wallet for user: ${newUser.id}`);
    const walletId = randomUUID(); // Generate UUID explicitly
    
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({
        id: walletId, // Explicitly set the ID
        userId: newUser.id,
        walletType: 'mobile_wallet',
        currency: 'USD',
        balance: 0,
      });

    if (walletError) {
      console.error(`[CreateUserAPI] ${requestId} - Wallet creation failed:`, walletError);
      // Don't fail the entire registration if wallet creation fails
      // The user can still be created, wallet can be created later
    } else {
      console.log(`[CreateUserAPI] ${requestId} - Wallet created successfully`);
    }

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

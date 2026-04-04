import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updateUserSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{8,14}$/, 'Use international phone format')
    .optional(),
  country: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.string().length(2, 'Country code must be 2 characters'))
    .optional(),
});

async function resolveCurrentUser() {
  const cookieStore = await cookies();
  const appUserId = cookieStore.get('wedupay-user-id')?.value;
  const appUserEmail = cookieStore.get('wedupay-user-email')?.value;

  return {
    appUserId,
    appUserEmail: appUserEmail ? decodeURIComponent(appUserEmail) : null,
  };
}

function formatUser(user: Record<string, unknown>) {
  return {
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    country: user.country,
    kycStatus: user.kycStatus,
    role: user.role,
    supabaseUserId: user.supabaseUserId,
    createdAt: user.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const { searchParams } = new URL(request.url);
    const supabaseUserId = searchParams.get('userId');
    const email = searchParams.get('email');
    const { appUserId, appUserEmail } = await resolveCurrentUser();

    let query = supabaseAdmin.from('users').select('*');

    if (supabaseUserId) {
      query = query.eq('supabaseUserId', supabaseUserId);
    } else if (email) {
      query = query.eq('email', email);
    } else if (appUserId) {
      query = query.eq('id', appUserId);
    } else if (appUserEmail) {
      query = query.eq('email', appUserEmail);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
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
        user: formatUser(user),
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

export async function PUT(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const { appUserId } = await resolveCurrentUser();

    if (!appUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = {};

    if (validation.data.phoneNumber) {
      updateData.phoneNumber = validation.data.phoneNumber;
    }

    if (validation.data.country) {
      updateData.country = validation.data.country;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No changes submitted',
        },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', appUserId)
      .select('*')
      .single();

    if (error || !user) {
      console.error(`[UpdateUserAPI] ${requestId} - Update failed:`, error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update user profile',
        },
        { status: 500 }
      );
    }

    if (user.supabaseUserId) {
      await supabaseAdmin.auth.admin.updateUserById(user.supabaseUserId, {
        user_metadata: {
          phone_number: user.phoneNumber,
          country: user.country,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        user: formatUser(user),
        message: 'Profile updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[UpdateUserAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user profile',
      },
      { status: 500 }
    );
  }
}

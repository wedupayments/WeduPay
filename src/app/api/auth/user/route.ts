import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest, requireAuth, requireAppUser } from '@/lib/auth';

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
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const supabaseUserId = searchParams.get('userId');
    const email = searchParams.get('email');

    let query = supabaseAdmin.from('users').select('*');

    if (supabaseUserId) {
      if (auth.supabaseUserId !== supabaseUserId && auth.role !== 'ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
          },
          { status: 403 }
        );
      }
      query = query.eq('supabaseUserId', supabaseUserId);
    } else if (email) {
      if (auth.email !== email.trim().toLowerCase() && auth.role !== 'ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
          },
          { status: 403 }
        );
      }
      query = query.eq('email', email);
    } else {
      const profileError = requireAppUser(auth);
      if (profileError) {
        return profileError;
      }
      query = query.eq('id', auth.userId!);
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
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
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
      .eq('id', auth.userId!)
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

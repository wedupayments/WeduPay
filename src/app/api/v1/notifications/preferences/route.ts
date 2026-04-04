import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest, requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const defaultPreferenceTypes = {
  transferConfirmation: true,
  transferCompleted: true,
  transferFailed: true,
  securityAlert: true,
  marketing: false,
  lowBalanceAlert: true,
};

const preferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  types: z.object({
    transferConfirmation: z.boolean().optional(),
    transferCompleted: z.boolean().optional(),
    transferFailed: z.boolean().optional(),
    securityAlert: z.boolean().optional(),
    marketing: z.boolean().optional(),
    lowBalanceAlert: z.boolean().optional(),
  }).optional(),
});

async function getUserWithSupabaseId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phoneNumber: true,
      supabaseUserId: true,
    },
  });
}

async function getStoredPreferences(supabaseUserId?: string | null) {
  if (!supabaseUserId) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  if (error || !data.user) {
    return null;
  }

  return (data.user.user_metadata?.notificationPreferences ?? null) as
    | {
        emailEnabled?: boolean;
        smsEnabled?: boolean;
        types?: Partial<typeof defaultPreferenceTypes>;
      }
    | null;
}

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[NotificationPrefsAPI] ${requestId} - Getting preferences`);

  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    const user = await getUserWithSupabaseId(auth.userId!);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const storedPreferences = await getStoredPreferences(user.supabaseUserId);

    return NextResponse.json({
      success: true,
      preferences: {
        emailEnabled: storedPreferences?.emailEnabled ?? true,
        smsEnabled: storedPreferences?.smsEnabled ?? true,
        email: user.email,
        phoneNumber: user.phoneNumber,
        types: {
          ...defaultPreferenceTypes,
          ...(storedPreferences?.types ?? {}),
        },
      },
    });
  } catch (error) {
    console.error(`[NotificationPrefsAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get preferences',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[NotificationPrefsAPI] ${requestId} - Updating preferences`);

  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    const body = await request.json();
    const validation = preferencesSchema.safeParse(body);

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

    const user = await getUserWithSupabaseId(auth.userId!);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const existingPreferences = await getStoredPreferences(user.supabaseUserId);
    const mergedPreferences = {
      emailEnabled: validation.data.emailEnabled ?? existingPreferences?.emailEnabled ?? true,
      smsEnabled: validation.data.smsEnabled ?? existingPreferences?.smsEnabled ?? true,
      types: {
        ...defaultPreferenceTypes,
        ...(existingPreferences?.types ?? {}),
        ...(validation.data.types ?? {}),
      },
    };

    if (user.supabaseUserId) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseUserId, {
        user_metadata: {
          notificationPreferences: mergedPreferences,
        },
      });

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      preferences: {
        ...mergedPreferences,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error(`[NotificationPrefsAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update preferences',
      },
      { status: 500 }
    );
  }
}

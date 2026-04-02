/**
 * Notification Preferences API
 * 
 * Manage user notification preferences (email, SMS, push).
 * Users can opt-in/out of different notification types.
 * 
 * @endpoint GET /api/v1/notifications/preferences
 * @endpoint PUT /api/v1/notifications/preferences
 * 
 * @returns {Object} response
 * @returns {Object} preferences - User notification preferences
 * @returns {boolean} preferences.emailEnabled - Email notifications enabled
 * @returns {boolean} preferences.smsEnabled - SMS notifications enabled
 * @returns {Object} preferences.types - Notification type preferences
 * 
 * @example
 * // Request
 * PUT /api/v1/notifications/preferences
 * {
 *   "emailEnabled": true,
 *   "smsEnabled": false,
 *   "types": {
 *     "transferConfirmation": true,
 *     "transferCompleted": true,
 *     "transferFailed": true,
 *     "securityAlert": true,
 *     "marketing": false
 *   }
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "preferences": {
 *     "emailEnabled": true,
 *     "smsEnabled": false,
 *     "types": { ... }
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Preferences validation schema
 */
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

/**
 * GET user notification preferences
 */
export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[NotificationPrefsAPI] ${requestId} - Getting preferences`);

  try {
    // Get user ID from auth (would be from session in real implementation)
    const userId = request.headers.get('x-user-id') || 'user-123';

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Get or create user preferences
    let preferences = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        phoneNumber: true,
      },
    });

    if (!preferences) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Return default preferences (in production, store in database)
    return NextResponse.json({
      success: true,
      preferences: {
        emailEnabled: true,
        smsEnabled: true,
        email: preferences.email,
        phoneNumber: preferences.phoneNumber,
        types: {
          transferConfirmation: true,
          transferCompleted: true,
          transferFailed: true,
          securityAlert: true,
          marketing: false,
          lowBalanceAlert: true,
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

/**
 * UPDATE user notification preferences
 */
export async function PUT(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[NotificationPrefsAPI] ${requestId} - Updating preferences`);

  try {
    // Parse and validate request
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

    // Get user ID from auth
    const userId = request.headers.get('x-user-id') || 'user-123';

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // In production, update user preferences in database
    // For now, just return the updated preferences
    return NextResponse.json({
      success: true,
      preferences: {
        emailEnabled: validation.data.emailEnabled ?? true,
        smsEnabled: validation.data.smsEnabled ?? true,
        types: validation.data.types ?? {
          transferConfirmation: true,
          transferCompleted: true,
          transferFailed: true,
          securityAlert: true,
          marketing: false,
          lowBalanceAlert: true,
        },
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

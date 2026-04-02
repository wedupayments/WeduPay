/**
 * Admin Compliance Review API
 * 
 * Manage compliance review queue (approve/reject transfers).
 * 
 * @endpoint GET /api/v1/admin/compliance - Get review queue
 * @endpoint POST /api/v1/admin/compliance/:ref/approve - Approve transfer
 * @endpoint POST /api/v1/admin/compliance/:ref/reject - Reject transfer
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getComplianceQueue,
  approveComplianceReview,
  rejectComplianceReview,
} from '@/services/admin/admin.service';

/**
 * GET - Get compliance review queue
 */
export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[AdminComplianceAPI] ${requestId} - Getting compliance queue`);

  try {
    // Verify admin access
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const queue = await getComplianceQueue();

    return NextResponse.json({
      success: true,
      queue,
    });
  } catch (error) {
    console.error(`[AdminComplianceAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get compliance queue',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Approve/reject compliance review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const { ref } = await params;

  console.log(`[AdminComplianceAPI] ${requestId} - Processing compliance review for ${ref}`);

  try {
    // Verify admin access
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, reason } = body;

    let result;

    if (action === 'approve') {
      result = await approveComplianceReview(ref, userId || 'admin');
    } else if (action === 'reject') {
      result = await rejectComplianceReview(ref, userId || 'admin', reason || 'Compliance review failed');
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Transfer ${action}d successfully`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[AdminComplianceAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process review',
      },
      { status: 500 }
    );
  }
}

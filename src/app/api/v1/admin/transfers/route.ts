/**
 * Admin Transfers API
 * 
 * Manage transfers (list, update status, compliance review).
 * 
 * @endpoint GET /api/v1/admin/transfers - List transfers
 * @endpoint PUT /api/v1/admin/transfers/:ref - Update transfer status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminTransfers,
  updateTransferStatus,
} from '@/services/admin/admin.service';
import { authenticateRequest, requireAuth } from '@/lib/auth';

/**
 * GET - List transfers with filtering
 */
export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[AdminTransfersAPI] ${requestId} - Getting transfers`);

  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    if (auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getAdminTransfers({ page, limit, status, search });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(`[AdminTransfersAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transfers',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update transfer status
 */
export async function PUT(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  console.log(`[AdminTransfersAPI] ${requestId} - Updating transfer status`);

  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    if (auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ref, status, reason } = body;

    if (!ref) {
      return NextResponse.json(
        { success: false, error: 'Transfer reference is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const result = await updateTransferStatus(ref, status, reason);

    if (result.success) {
      return NextResponse.json({
        success: true,
        transfer: result.transfer,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[AdminTransfersAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update transfer',
      },
      { status: 500 }
    );
  }
}

/**
 * Admin Transfers API
 * 
 * Manage transfers (list, update status, compliance review).
 * 
 * @endpoint GET /api/v1/admin/transfers - List transfers
 * @endpoint PUT /api/v1/admin/transfers/:ref - Update transfer status
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminController } from '@/controllers/admin.controller';
import { authenticateRequest, requireAuth } from '@/lib/auth';

/**
 * GET - List transfers with filtering
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;

  if (auth.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  return adminController.listTransfers(request);
}

/**
 * PUT - Update transfer status
 */
export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;

  if (auth.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  return adminController.updateTransferStatus(request);
}

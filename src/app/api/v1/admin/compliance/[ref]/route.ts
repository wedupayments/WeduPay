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
import { adminController } from '@/controllers/admin.controller';
import { authenticateRequest, requireAuth, requireAppUser } from '@/lib/auth';

/**
 * GET - Get compliance review queue
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;

  if (auth.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  return adminController.getComplianceQueue(request);
}

/**
 * POST - Approve/reject compliance review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;

  const profileError = requireAppUser(auth);
  if (profileError) return profileError;

  if (auth.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  const { ref } = await params;
  return adminController.processComplianceReview(request, ref, auth.userId!);
}

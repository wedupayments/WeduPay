/**
 * Admin Dashboard Stats API
 * 
 * Get platform statistics for admin dashboard.
 * 
 * @endpoint GET /api/v1/admin/stats
 * 
 * @returns {Object} response
 * @returns {Object} stats - Platform statistics
 * @returns {number} stats.totalUsers - Total registered users
 * @returns {number} stats.totalTransfers - Total transfers processed
 * @returns {number} stats.pendingTransfers - Transfers pending review
 * @returns {number} stats.failedTransfers - Failed transfers
 * @returns {number} stats.totalVolume - Total transfer volume
 * @returns {number} stats.todayVolume - Today's transfer volume
 * @returns {Array} stats.providerHealth - Provider health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminController } from '@/controllers/admin.controller';
import { authenticateRequest, requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;

  if (auth.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  return adminController.getStats(request);
}

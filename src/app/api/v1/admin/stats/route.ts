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
import { getAdminStats } from '@/services/admin/admin.service';

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[AdminStatsAPI] ${requestId} - Getting admin stats`);

  try {
    // In production, verify admin authentication
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
        },
        { status: 403 }
      );
    }

    const stats = await getAdminStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error(`[AdminStatsAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      },
      { status: 500 }
    );
  }
}

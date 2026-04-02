/**
 * Admin Dashboard Service
 * 
 * Provides admin-specific functionality for monitoring transfers,
 * compliance review, user management, and system analytics.
 * 
 * Features:
 * - Transfer monitoring and management
 * - Compliance review queue
 * - User management
 * - Provider health dashboard
 * - System analytics
 * - Admin user roles and permissions
 * 
 * @module services/admin
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admin dashboard statistics
 */
export interface AdminStats {
  totalUsers: number;
  totalTransfers: number;
  pendingTransfers: number;
  failedTransfers: number;
  totalVolume: number;
  todayVolume: number;
  providerHealth: Array<{ provider: string; status: string; uptime: number }>;
}

/**
 * Transfer for admin review
 */
export interface AdminTransfer {
  id: string;
  transferRef: string;
  userId: string;
  status: string;
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  recipientPhone: string;
  recipientCountry: string;
  routingProvider: string;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
  complianceCheck?: any;
}

/**
 * Compliance review item
 */
export interface ComplianceReview {
  transferId: string;
  transferRef: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  currency: string;
  riskLevel: string;
  riskScore: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

/**
 * ============================
 * DASHBOARD STATISTICS
 * ============================
 */

/**
 * Get admin dashboard statistics
 * 
 * @returns AdminStats with platform overview
 * 
 * @example
 * ```typescript
 * const stats = await getAdminStats();
 * console.log(`Total users: ${stats.totalUsers}`);
 * console.log(`Pending transfers: ${stats.pendingTransfers}`);
 * ```
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Get counts and aggregates
    const [
      totalUsers,
      totalTransfers,
      pendingTransfers,
      failedTransfers,
      volumeStats,
      todayStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.p2PTransfer.count(),
      prisma.p2PTransfer.count({ where: { status: 'PENDING' } }),
      prisma.p2PTransfer.count({ where: { status: 'FAILED' } }),
      prisma.p2PTransfer.aggregate({
        _sum: { sendAmount: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.p2PTransfer.aggregate({
        _sum: { sendAmount: true },
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // Get provider health
    const providerHealth = await prisma.paymentProvider.findMany({
      select: {
        name: true,
        successRate: true,
        avgResponseTime: true,
        lastHealthCheck: true,
      },
    });

    return {
      totalUsers,
      totalTransfers,
      pendingTransfers,
      failedTransfers,
      totalVolume: volumeStats._sum.sendAmount || 0,
      todayVolume: todayStats._sum.sendAmount || 0,
      providerHealth: providerHealth.map(p => ({
        provider: p.name,
        status: p.lastHealthCheck ? 'HEALTHY' : 'UNKNOWN',
        uptime: p.successRate,
      })),
    };
  } catch (error) {
    console.error('Get admin stats error:', error);
    throw new Error('Failed to get admin statistics');
  }
}

/**
 * ============================
 * TRANSFER MANAGEMENT
 * ============================
 */

/**
 * Get all transfers for admin view
 * 
 * @param options - Query options (page, limit, status filter)
 * @returns Paginated transfer list
 * 
 * @example
 * ```typescript
 * const transfers = await getAdminTransfers({
 *   page: 1,
 *   limit: 20,
 *   status: 'PENDING'
 * });
 * ```
 */
export async function getAdminTransfers(options: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<{
  transfers: AdminTransfer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  try {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.search) {
      where.OR = [
        { transferRef: { contains: options.search } },
        { recipientPhone: { contains: options.search } },
      ];
    }

    // Get transfers and count
    const [transfers, total] = await Promise.all([
      prisma.p2PTransfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.p2PTransfer.count({ where }),
    ]);

    return {
      transfers: transfers.map(t => ({
        id: t.id,
        transferRef: t.transferRef,
        userId: t.userId,
        status: t.status,
        sendAmount: t.sendAmount,
        sendCurrency: t.sendCurrency,
        receiveAmount: t.receiveAmount,
        receiveCurrency: t.receiveCurrency,
        recipientPhone: t.recipientPhone,
        recipientCountry: t.recipientCountry,
        routingProvider: t.routingProvider,
        createdAt: t.createdAt,
        completedAt: t.completedAt || undefined,
        failureReason: t.failureReason || undefined,
        complianceCheck: t.complianceCheck ? JSON.parse(t.complianceCheck) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Get admin transfers error:', error);
    throw new Error('Failed to get transfers');
  }
}

/**
 * Get single transfer details for admin
 * 
 * @param transferRef - Transfer reference
 * @returns Transfer details with full information
 */
export async function getAdminTransfer(transferRef: string): Promise<AdminTransfer | null> {
  try {
    const transfer = await prisma.p2PTransfer.findFirst({
      where: { transferRef },
    });

    if (!transfer) return null;

    return {
      id: transfer.id,
      transferRef: transfer.transferRef,
      userId: transfer.userId,
      status: transfer.status,
      sendAmount: transfer.sendAmount,
      sendCurrency: transfer.sendCurrency,
      receiveAmount: transfer.receiveAmount,
      receiveCurrency: transfer.receiveCurrency,
      recipientPhone: transfer.recipientPhone,
      recipientCountry: transfer.recipientCountry,
      routingProvider: transfer.routingProvider,
      createdAt: transfer.createdAt,
      completedAt: transfer.completedAt || undefined,
      failureReason: transfer.failureReason || undefined,
      complianceCheck: transfer.complianceCheck ? JSON.parse(transfer.complianceCheck) : null,
    };
  } catch (error) {
    console.error('Get admin transfer error:', error);
    return null;
  }
}

/**
 * Update transfer status (admin action)
 * 
 * @param transferRef - Transfer reference
 * @param status - New status
 * @param reason - Admin reason for status change
 * @returns Updated transfer
 */
export async function updateTransferStatus(
  transferRef: string,
  status: string,
  reason?: string
): Promise<{ success: boolean; transfer?: AdminTransfer; error?: string }> {
  try {
    const updated = await prisma.p2PTransfer.update({
      where: { transferRef },
      data: {
        status,
        failureReason: status === 'FAILED' ? reason : undefined,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
      },
    });

    return {
      success: true,
      transfer: {
        id: updated.id,
        transferRef: updated.transferRef,
        userId: updated.userId,
        status: updated.status,
        sendAmount: updated.sendAmount,
        sendCurrency: updated.sendCurrency,
        receiveAmount: updated.receiveAmount,
        receiveCurrency: updated.receiveCurrency,
        recipientPhone: updated.recipientPhone,
        recipientCountry: updated.recipientCountry,
        routingProvider: updated.routingProvider,
        createdAt: updated.createdAt,
        completedAt: updated.completedAt || undefined,
        failureReason: updated.failureReason || undefined,
        complianceCheck: updated.complianceCheck ? JSON.parse(updated.complianceCheck) : null,
      },
    };
  } catch (error) {
    console.error('Update transfer status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update transfer',
    };
  }
}

/**
 * ============================
 * COMPLIANCE REVIEW
 * ============================
 */

/**
 * Get compliance review queue
 * 
 * @returns Array of transfers pending compliance review
 */
export async function getComplianceQueue(): Promise<ComplianceReview[]> {
  try {
    const pendingReviews = await prisma.p2PTransfer.findMany({
      where: {
        status: 'PENDING',
        kycRequired: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user details separately
    const complianceReviews: ComplianceReview[] = [];

    for (const t of pendingReviews) {
      const user = await prisma.user.findUnique({
        where: { id: t.userId },
        select: { email: true, phoneNumber: true },
      });

      const complianceData = t.complianceCheck ? JSON.parse(t.complianceCheck) : {};
      
      complianceReviews.push({
        transferId: t.id,
        transferRef: t.transferRef,
        userId: t.userId,
        userName: user?.email?.split('@')[0],
        userEmail: user?.email,
        amount: t.sendAmount,
        currency: t.sendCurrency,
        riskLevel: complianceData.riskLevel || 'MEDIUM',
        riskScore: complianceData.riskScore || 50,
        reason: 'High-risk transaction requiring review',
        status: 'pending',
        createdAt: t.createdAt,
      });
    }

    return complianceReviews;
  } catch (error) {
    console.error('Get compliance queue error:', error);
    return [];
  }
}

/**
 * Approve compliance review
 * 
 * @param transferRef - Transfer reference
 * @param adminUserId - Admin user ID who approved
 * @returns Result with success status
 */
export async function approveComplianceReview(
  transferRef: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update transfer status
    await prisma.p2PTransfer.update({
      where: { transferRef },
      data: {
        status: 'PROCESSING',
        kycStatus: 'VERIFIED',
      },
    });

    // Record compliance check
    await prisma.complianceCheck.create({
      data: {
        transferId: transferRef,
        checkType: 'admin_review',
        status: 'PASS',
        riskLevel: 'LOW',
        action: 'approved',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Approve compliance review error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve',
    };
  }
}

/**
 * Reject compliance review
 * 
 * @param transferRef - Transfer reference
 * @param adminUserId - Admin user ID who rejected
 * @param reason - Reason for rejection
 * @returns Result with success status
 */
export async function rejectComplianceReview(
  transferRef: string,
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update transfer status
    await prisma.p2PTransfer.update({
      where: { transferRef },
      data: {
        status: 'FAILED',
        failureReason: `Compliance review rejected: ${reason}`,
        kycStatus: 'REJECTED',
        completedAt: new Date(),
      },
    });

    // Record compliance check
    await prisma.complianceCheck.create({
      data: {
        transferId: transferRef,
        checkType: 'admin_review',
        status: 'FAIL',
        riskLevel: 'HIGH',
        action: 'rejected',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        details: JSON.stringify({ reason }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Reject compliance review error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject',
    };
  }
}

/**
 * ============================
 * USER MANAGEMENT
 * ============================
 */

/**
 * Get all users for admin view
 * 
 * @param options - Query options (page, limit, search)
 * @returns Paginated user list
 */
export async function getAdminUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  users: Array<{
    id: string;
    email: string;
    phoneNumber: string;
    country: string;
    kycStatus: string;
    role: string;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  try {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.search) {
      where.OR = [
        { email: { contains: options.search } },
        { phoneNumber: { contains: options.search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          country: true,
          kycStatus: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Get admin users error:', error);
    throw new Error('Failed to get users');
  }
}

/**
 * Update user KYC status (admin action)
 * 
 * @param userId - User ID
 * @param kycStatus - New KYC status
 * @returns Result with success status
 */
export async function updateUserKycStatus(
  userId: string,
  kycStatus: 'pending' | 'verified' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus },
    });

    return { success: true };
  } catch (error) {
    console.error('Update user KYC status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update KYC status',
    };
  }
}

/**
 * Update user role (admin action)
 * 
 * @param userId - User ID
 * @param role - New role
 * @returns Result with success status
 */
export async function updateUserRole(
  userId: string,
  role: 'USER' | 'ADMIN' | 'MERCHANT'
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return { success: true };
  } catch (error) {
    console.error('Update user role error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role',
    };
  }
}

export default {
  getAdminStats,
  getAdminTransfers,
  getAdminTransfer,
  updateTransferStatus,
  getComplianceQueue,
  approveComplianceReview,
  rejectComplianceReview,
  getAdminUsers,
  updateUserKycStatus,
  updateUserRole,
};

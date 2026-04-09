import { NextResponse } from 'next/server';
import {
  getAdminStats,
  getAdminTransfers,
  updateTransferStatus,
  getComplianceQueue,
  approveComplianceReview,
  rejectComplianceReview,
} from '@/services/admin/admin.service';

export class AdminController {
  // ── Stats ──────────────────────────────────────────────────
  async getStats(request: Request) {
    try {
      const stats = await getAdminStats();
      return NextResponse.json({ success: true, stats });
    } catch (error) {
      console.error("[AdminController] getStats error:", error);
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to get stats' },
        { status: 500 }
      );
    }
  }

  // ── Transfers ──────────────────────────────────────────────
  async listTransfers(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status') || undefined;
      const search = searchParams.get('search') || undefined;

      const result = await getAdminTransfers({ page, limit, status, search });
      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      console.error("[AdminController] listTransfers error:", error);
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to get transfers' },
        { status: 500 }
      );
    }
  }

  async updateTransferStatus(request: Request) {
    try {
      const body = await request.json();
      const { ref, status, reason } = body;

      if (!ref) {
        return NextResponse.json({ success: false, error: 'Transfer reference is required' }, { status: 400 });
      }
      if (!status) {
        return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
      }

      const result = await updateTransferStatus(ref, status, reason);

      if (result.success) {
        return NextResponse.json({ success: true, transfer: result.transfer });
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
    } catch (error) {
      console.error("[AdminController] updateTransferStatus error:", error);
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to update transfer' },
        { status: 500 }
      );
    }
  }

  // ── Compliance Queue ───────────────────────────────────────
  async getComplianceQueue(request: Request) {
    try {
      const queue = await getComplianceQueue();
      return NextResponse.json({ success: true, queue });
    } catch (error) {
      console.error("[AdminController] getComplianceQueue error:", error);
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to get compliance queue' },
        { status: 500 }
      );
    }
  }

  async processComplianceReview(request: Request, ref: string, adminUserId: string) {
    try {
      const body = await request.json();
      const { action, reason } = body;

      let result;
      if (action === 'approve') {
        result = await approveComplianceReview(ref, adminUserId);
      } else if (action === 'reject') {
        result = await rejectComplianceReview(ref, adminUserId, reason || 'Compliance review failed');
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "approve" or "reject"' },
          { status: 400 }
        );
      }

      if (result.success) {
        return NextResponse.json({ success: true, message: `Transfer ${action}d successfully` });
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
    } catch (error) {
      console.error("[AdminController] processComplianceReview error:", error);
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to process review' },
        { status: 500 }
      );
    }
  }
}

export const adminController = new AdminController();

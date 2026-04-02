/**
 * P2P Transfer Status API
 * 
 * Get status of a P2P transfer
 */

import { NextRequest, NextResponse } from 'next/server';
import { P2PTransferService } from '@/services/routing/p2p-transfer-service';

const p2pService = new P2PTransferService();

// ============================================
// GET TRANSFER STATUS
// ============================================

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    const { searchParams } = new URL(request.url);
    const transferRef = searchParams.get('ref');

    if (!transferRef) {
      return NextResponse.json({
        success: false,
        requestId,
        error: 'Missing transfer reference. Use ?ref=TRANSFER-REF',
      }, { status: 400 });
    }

    const status = await p2pService.getTransferStatus(transferRef);

    return NextResponse.json({
      success: true,
      requestId,
      transfer: status,
      statusHistory: getStatusHistory(status),
    });

  } catch (error) {
    console.error(`[P2PStatusAPI] ${requestId} - Error:`, error);

    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

function getStatusHistory(status: any) {
  const history = [
    {
      status: 'INITIATED',
      timestamp: status.createdAt,
      description: 'Transfer initiated',
    },
  ];

  if (status.completedAt) {
    history.push({
      status: 'COMPLETED',
      timestamp: status.completedAt,
      description: 'Funds delivered to recipient',
    });
  }

  if (status.failureReason) {
    history.push({
      status: 'FAILED',
      timestamp: status.completedAt || status.createdAt,
      description: status.failureReason,
    });
  }

  return history;
}

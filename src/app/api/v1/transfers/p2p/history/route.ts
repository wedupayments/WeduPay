/**
 * P2P Transfer History API
 * 
 * Get user's transfer history
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { P2PTransferService } from '@/services/routing/p2p-transfer-service';

const p2pService = new P2PTransferService();

// ============================================
// REQUEST VALIDATION
// ============================================

const historyQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  status: z.string().optional(),
});

// ============================================
// API HANDLER
// ============================================

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    const { searchParams } = new URL(request.url);
    const validatedData = historyQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
    });

    const history = await p2pService.getTransferHistory('user-123', { // Would be from auth
      page: parseInt(validatedData.page),
      limit: parseInt(validatedData.limit),
      status: validatedData.status,
    });

    return NextResponse.json({
      success: true,
      requestId,
      ...history,
    });

  } catch (error) {
    console.error(`[P2PHistoryAPI] ${requestId} - Error:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        requestId,
        error: 'Validation error',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

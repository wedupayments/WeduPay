/**
 * P2P Recipients API
 * 
 * Manage saved transfer recipients
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { P2PTransferService } from '@/services/routing/p2p-transfer-service';
import { authenticateRequest, requireAuth, requireAppUser } from '@/lib/auth';

const p2pService = new P2PTransferService();

// ============================================
// REQUEST VALIDATION
// ============================================

const recipientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(10, 'Invalid phone number'),
  country: z.string().length(2, 'Invalid country code'),
  walletType: z.string().optional().default('mobile_wallet'),
});

// ============================================
// GET RECIPIENTS
// ============================================

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }

    const recipients = await p2pService.getRecipients(auth.userId!);

    return NextResponse.json({
      success: true,
      requestId,
      recipients,
    });

  } catch (error) {
    console.error(`[P2PRecipientsAPI] ${requestId} - Error:`, error);

    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ============================================
// ADD RECIPIENT
// ============================================

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }

    const body = await request.json();
    const validatedData = recipientSchema.parse(body);

    const recipient = await p2pService.saveRecipient({
      userId: auth.userId!,
      ...validatedData,
    });

    return NextResponse.json({
      success: true,
      requestId,
      recipient,
      message: 'Recipient saved successfully',
    }, { status: 201 });

  } catch (error) {
    console.error(`[P2PRecipientsAPI] ${requestId} - Error:`, error);

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

// ============================================
// DELETE RECIPIENT
// ============================================

export async function DELETE(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('id');

    if (!recipientId) {
      return NextResponse.json({
        success: false,
        requestId,
        error: 'Missing recipient ID. Use ?id=RECIPIENT-ID',
      }, { status: 400 });
    }

    await p2pService.deleteRecipient(auth.userId!, recipientId);

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Recipient deleted successfully',
    });

  } catch (error) {
    console.error(`[P2PRecipientsAPI] ${requestId} - Error:`, error);

    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { mtnAPI } from "@/lib/mtn";
import { createErrorResponse } from "@/lib/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ referenceId: string }> }
) {
  try {
    const { referenceId } = await params;

    const status = await mtnAPI.getTransactionStatus(referenceId);

    return NextResponse.json({
      data: {
        type: "transaction-status",
        attributes: {
          referenceId,
          status: status.status,
          amount: status.amount,
          currency: status.currency,
          partyId: status.partyId,
          creationDate: status.creationDate,
          modificationDate: status.modificationDate,
          serviceStatus: status.serviceStatus,
          statusDescription: mtnAPI.getStatusDescription(status.serviceStatus),
        },
        _links: {
          self: { href: `/api/mtn/status/${referenceId}` },
        },
      },
    }, { status: 200 });
  } catch (error) {
    console.error("MTN status check error:", error);
    const errorResp = createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to check transaction status",
      undefined,
      500
    );
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

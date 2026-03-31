import { NextResponse } from "next/server";
import { mpesaAPI } from "@/lib/mpesa";
import { createErrorResponse } from "@/lib/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ checkoutRequestId: string }> }
) {
  try {
    const { checkoutRequestId } = await params;

    const status = await mpesaAPI.querySTKStatus(checkoutRequestId);

    const statusMap: Record<string, string> = {
      "0": "COMPLETED",
      "17": "FAILED",
    };

    return NextResponse.json({
      data: {
        type: "transaction-status",
        attributes: {
          checkoutRequestId,
          status: statusMap[status.responseCode] || "PENDING",
          responseCode: status.responseCode,
          responseDescription: status.responseDescription,
          transactionReceipt: status.transactionReceipt,
          transactionDate: status.transactionDate,
          transactionAmount: status.transactionAmount,
        },
        _links: {
          self: { href: `/api/mpesa/status/${checkoutRequestId}` },
        },
      },
    }, { status: 200 });
  } catch (error) {
    console.error("M-Pesa status check error:", error);
    const errorResp = createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to check transaction status",
      undefined,
      500
    );
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

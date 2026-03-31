import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ecocashAPI } from "@/lib/ecocash";
import { createErrorResponse } from "@/lib/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: { reference },
    });

    if (!transaction) {
      const error = createErrorResponse(
        "NOT_FOUND",
        "Transaction not found",
        undefined,
        404
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json({
        data: {
          id: transaction.id,
          type: "transaction-status",
          attributes: {
            reference: transaction.reference,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
          },
          _links: {
            self: { href: `/api/ecocash/status/${reference}` },
          },
        },
      }, { status: 200 });
    }

    const lookupResult = await ecocashAPI.lookupTransaction("", reference);

    let newStatus = transaction.status;
    if (lookupResult.paymentSuccess) {
      newStatus = "COMPLETED";
    } else if (lookupResult.status === "FAILED") {
      newStatus = "FAILED";
    }

    if (newStatus !== transaction.status) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: newStatus },
      });
    }

    return NextResponse.json({
      data: {
        id: transaction.id,
        type: "transaction-status",
        attributes: {
          reference: transaction.reference,
          status: newStatus,
          amount: transaction.amount,
          currency: transaction.currency,
          providerStatus: lookupResult.status,
          ecocashReference: lookupResult.ecocashReference,
          transactionDateTime: lookupResult.transactionDateTime,
        },
        _links: {
          self: { href: `/api/ecocash/status/${reference}` },
        },
      },
    }, { status: 200 });
  } catch (error) {
    console.error("EcoCash status check error:", error);
    const errorResp = createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to check transaction status",
      undefined,
      500
    );
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

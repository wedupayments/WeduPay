import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse } from "@/lib/api-response";

function buildResourceUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}/api/v1/webhooks/mtn`;
}

export async function GET(request: Request) {
  return NextResponse.json(
    {
      data: {
        type: "webhook",
        id: "mtn",
        attributes: {
          provider: "MTN",
          status: "active",
          supportedEvents: ["COLLECTION", "REFUND", "REVERSAL"],
        },
      },
      links: {
        self: buildResourceUrl(request),
      },
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  try {
    const callback = await request.json();
    console.log("MTN webhook received:", JSON.stringify(callback));

    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        provider: "MTN",
        eventType: "COLLECTION",
        payload: JSON.stringify(callback),
        status: "RECEIVED",
      },
    });

    const transactionStatus = callback.transaction?.status?.toUpperCase();

    if (transactionStatus === "SUCCESS" || transactionStatus === "COMPLETED") {
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });

      const pendingTransaction = await prisma.transaction.findFirst({
        where: {
          reference: { contains: callback.transaction?.transactionRef },
          status: "PENDING",
        },
      });

      if (pendingTransaction) {
        await prisma.transaction.update({
          where: { id: pendingTransaction.id },
          data: { status: "COMPLETED", reference: callback.transaction?.transactionId },
        });
      }

      return NextResponse.json(
        {
          data: {
            type: "webhook-response",
            id: webhookEvent.id,
            attributes: { status: "SUCCESS", message: "Payment processed successfully" },
          },
        },
        { status: 200 }
      );
    } else if (transactionStatus === "FAILED" || transactionStatus === "REVERSED") {
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: "FAILED", errorMessage: `Transaction ${transactionStatus}`, processedAt: new Date() },
      });

      return NextResponse.json(
        {
          data: {
            type: "webhook-response",
            id: webhookEvent.id,
            attributes: { status: "FAILED", message: `Transaction ${transactionStatus}` },
          },
        },
        { status: 200 }
      );
    } else {
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: "PENDING" },
      });

      return NextResponse.json(
        {
          data: {
            type: "webhook-response",
            id: webhookEvent.id,
            attributes: { status: "PENDING", message: "Transaction is pending" },
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("MTN webhook error:", error);
    const errorResp = createErrorResponse("WEBHOOK_ERROR", "Webhook processing failed", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

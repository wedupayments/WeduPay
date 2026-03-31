import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse } from "@/lib/api-response";

function buildResourceUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}/api/v1/webhooks/ecocash`;
}

export async function GET(request: Request) {
  return NextResponse.json(
    {
      data: {
        type: "webhook",
        id: "ecocash",
        attributes: {
          provider: "EcoCash",
          status: "active",
          supportedEvents: ["PUSH_PAYMENT", "PULL_PAYMENT", "REFUND"],
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
    console.log("EcoCash webhook received:", JSON.stringify(callback));

    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        provider: "ECOCASH",
        eventType: "PUSH_PAYMENT",
        payload: JSON.stringify(callback),
        status: "RECEIVED",
      },
    });

    const { status, transactionId } = callback;

    if (status === "SUCCESS" && transactionId) {
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });

      const pendingTransaction = await prisma.transaction.findFirst({
        where: { reference: { contains: transactionId }, status: "PENDING" },
      });

      if (pendingTransaction) {
        await prisma.transaction.update({
          where: { id: pendingTransaction.id },
          data: { status: "COMPLETED", reference: transactionId },
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
    } else {
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: "FAILED", errorMessage: status, processedAt: new Date() },
      });

      return NextResponse.json(
        {
          data: {
            type: "webhook-response",
            id: webhookEvent.id,
            attributes: { status: "FAILED", message: status || "Payment failed" },
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("EcoCash webhook error:", error);
    const errorResp = createErrorResponse("WEBHOOK_ERROR", "Webhook processing failed", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

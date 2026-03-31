import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse } from "@/lib/api-response";

interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>;
      };
    };
  };
}

function buildResourceUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}/api/v1/webhooks/mpesa`;
}

export async function GET(request: Request) {
  return NextResponse.json(
    {
      data: {
        type: "webhook",
        id: "mpesa",
        attributes: {
          provider: "M-Pesa",
          status: "active",
          supportedEvents: ["STK_CALLBACK", "B2C_RESULT", "C2B_CONFIRMATION"],
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
    const callback: MpesaCallback = await request.json();
    const { stkCallback } = callback.Body;

    console.log("M-Pesa webhook received:", JSON.stringify(callback));

    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        provider: "MPESA",
        eventType: "STK_CALLBACK",
        payload: JSON.stringify(callback),
        status: "RECEIVED",
      },
    });

    const resultCode = stkCallback.ResultCode;

    if (resultCode === 0 && stkCallback.CallbackMetadata) {
      const metadata = stkCallback.CallbackMetadata.Item;
      const amount = metadata.find((i) => i.Name === "Amount")?.Value;
      const receipt = metadata.find((i) => i.Name === "MpesaReceiptNumber")?.Value;

      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });

      if (amount) {
        const pendingTransaction = await prisma.transaction.findFirst({
          where: {
            reference: { contains: stkCallback.MerchantRequestID },
            status: "PENDING",
          },
        });

        if (pendingTransaction) {
          await prisma.transaction.update({
            where: { id: pendingTransaction.id },
            data: {
              status: "COMPLETED",
              reference: String(receipt || pendingTransaction.reference),
            },
          });
        }
      }

      return NextResponse.json(
        {
          data: {
            type: "webhook-response",
            id: webhookEvent.id,
            attributes: {
              resultCode: 0,
              resultDesc: "Accepted",
            },
          },
        },
        { status: 200 }
      );
    } else {
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: "FAILED",
          errorMessage: stkCallback.ResultDesc,
          processedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          data: {
            type: "webhook-response",
            id: webhookEvent.id,
            attributes: {
              resultCode,
              resultDesc: stkCallback.ResultDesc,
            },
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("M-Pesa webhook error:", error);
    const errorResp = createErrorResponse("WEBHOOK_ERROR", "Webhook processing failed", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

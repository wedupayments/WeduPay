import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mtnAPI } from "@/lib/mtn";
import { createErrorResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, phoneNumber, description } = body;

    if (!amount || amount <= 0) {
      const error = createErrorResponse(
        "INVALID_AMOUNT",
        "Amount must be greater than 0",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    if (!mtnAPI.validatePhoneNumber(phoneNumber)) {
      const error = createErrorResponse(
        "INVALID_PHONE",
        "Please enter a valid MTN phone number (e.g., 0771234567)",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    const transactionReference = `MTN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const transaction = await prisma.transaction.create({
      data: {
        userId: "system",
        amount,
        currency: "USD",
        status: "PENDING",
        type: "PAYMENT",
        reference: transactionReference,
      },
    });

    const mtnResponse = await mtnAPI.requestToPay({
      phoneNumber,
      amount,
      reference: transactionReference,
      description: description || "WeduPay Wallet Funding",
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/mtn`,
    });

    if (mtnResponse.status === "FAILED") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });

      const error = createErrorResponse(
        "PAYMENT_FAILED",
        mtnResponse.message || "MTN payment initiation failed",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    await prisma.webhookEvent.create({
      data: {
        provider: "MTN",
        eventType: "REQUEST_TO_PAY_INITIATED",
        payload: JSON.stringify(mtnResponse),
        status: "RECEIVED",
      },
    });

    const response = {
      data: {
        id: transaction.id,
        type: "payment",
        attributes: {
          amount: transaction.amount,
          currency: transaction.currency,
          status: "PENDING",
          provider: "MTN",
          phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"),
          reference: transaction.reference,
          mtnReferenceId: mtnResponse.referenceId,
          createdAt: transaction.createdAt,
        },
        _links: {
          self: { href: `/api/payments/${transaction.id}` },
          status: { href: `/api/mtn/status/${mtnResponse.referenceId}` },
        },
      },
      meta: {
        message: mtnResponse.message || "Payment initiated. Please check your phone and enter your PIN to confirm.",
        instructions: [
          "You will receive a prompt on your MTN phone",
          "Enter your MTN PIN to confirm",
          "The payment will be processed automatically",
        ],
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("MTN payment error:", error);
    const errorResp = createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to process payment",
      undefined,
      500
    );
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        {
          data: {
            type: "provider-info",
            attributes: {
              name: "MTN Mobile Money",
              supportedCurrencies: ["USD", "EUR", "XOF", "XAF"],
              minAmount: 0.50,
              maxAmount: 50000,
              description: "MTN Mobile Money is a mobile money service by MTN Group",
              logo: "/providers/mtn.svg",
            },
          },
        },
        { status: 200 }
      );
    }

    const isValid = mtnAPI.validatePhoneNumber(phone);

    return NextResponse.json({
      data: {
        type: "phone-validation",
        attributes: {
          phone,
          isValid,
          formatted: isValid ? phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3") : null,
          provider: "MTN",
        },
      },
    });
  } catch (error) {
    console.error("MTN validation error:", error);
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Failed to validate phone number" } },
      { status: 500 }
    );
  }
}

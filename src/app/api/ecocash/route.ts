import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { ecocashAPI } from "@/lib/ecocash";
import { createErrorResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const body = await request.json();
    const { amount, currency, phoneNumber, description } = body;

    if (!amount || amount <= 0) {
      const error = createErrorResponse("INVALID_AMOUNT", "Amount must be greater than 0", undefined, 400);
      return NextResponse.json(error.body, { status: error.status });
    }

    if (!ecocashAPI.validatePhoneNumber(phoneNumber)) {
      const error = createErrorResponse(
        "INVALID_PHONE",
        "Please enter a valid EcoCash phone number (e.g., 0771234567)",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    const transactionReference = `EC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: currency || "USD",
        status: "PENDING",
        type: "PAYMENT",
        reference: transactionReference,
      },
    });

    const ecocashResponse = await ecocashAPI.initiatePushPayment({
      amount,
      currency: currency || "USD",
      subscriberMsisdn: phoneNumber,
      merchantMsisdn: process.env.ECOCASH_MERCHANT_MSISDN || "",
      transactionReference,
      description: description || "WeduPay Wallet Funding",
    });

    if (ecocashResponse.status === "FAILED") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });

      const error = createErrorResponse(
        "PAYMENT_FAILED",
        ecocashResponse.resultDesc || "EcoCash payment initiation failed",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    await prisma.webhookEvent.create({
      data: {
        provider: "ECOCASH",
        eventType: "PUSH_PAYMENT_INITIATED",
        payload: JSON.stringify(ecocashResponse),
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
          provider: "EcoCash",
          phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"),
          reference: transaction.reference,
          checkoutRequestId: ecocashResponse.checkoutRequestId,
          createdAt: transaction.createdAt,
        },
        _links: {
          self: { href: `/api/payments/${transaction.id}` },
          status: { href: `/api/ecocash/status/${ecocashResponse.checkoutRequestId}` },
        },
      },
      meta: {
        message: "Payment initiated. Please check your phone and enter your PIN to confirm.",
        instructions: [
          "You will receive an STK push on your phone",
          "Enter your EcoCash PIN to confirm",
          "The payment will be processed automatically",
        ],
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("EcoCash payment error:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to process payment", undefined, 500);
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
              name: "EcoCash",
              supportedCurrencies: ["USD", "ZMW", "ZWL"],
              minAmount: 0.01,
              maxAmount: 10000,
              description: "EcoCash is a mobile money service by Econet Wireless Zimbabwe",
              logo: "/providers/ecocash.svg",
            },
          },
        },
        { status: 200 }
      );
    }

    const isValid = ecocashAPI.validatePhoneNumber(phone);

    return NextResponse.json({
      data: {
        type: "phone-validation",
        attributes: {
          phone,
          isValid,
          formatted: isValid ? phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3") : null,
          provider: "EcoCash",
        },
      },
    });
  } catch (error) {
    console.error("EcoCash validation error:", error);
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Failed to validate phone number" } },
      { status: 500 }
    );
  }
}

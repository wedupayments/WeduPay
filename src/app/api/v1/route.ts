import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  return NextResponse.json(
    {
      jsonapi: { version: "1.0" },
      meta: {
        apiVersion: "1.0",
        generatedAt: new Date().toISOString(),
      },
      data: {
        type: "api",
        id: "wedupay-v1",
        attributes: {
          name: "WeduPay API",
          description: "Mobile money payment API supporting EcoCash, M-Pesa, and MTN",
          version: "1.0.0",
        },
      },
      links: {
        self: `${baseUrl}/api/v1`,
        documentation: `${baseUrl}/api/docs`,
        transactions: {
          href: `${baseUrl}/api/v1/transactions`,
          methods: ["GET"],
        },
        payments: {
          href: `${baseUrl}/api/v1/payments`,
          methods: ["GET", "POST"],
        },
        transfers: {
          href: `${baseUrl}/api/v1/transfers`,
          methods: ["GET", "POST"],
        },
        wallets: {
          href: `${baseUrl}/api/v1/wallets`,
          methods: ["GET"],
        },
        webhooks: {
          mpesa: `${baseUrl}/api/v1/webhooks/mpesa`,
          ecocash: `${baseUrl}/api/v1/webhooks/ecocash`,
          mtn: `${baseUrl}/api/v1/webhooks/mtn`,
        },
      },
    },
    { status: 200 }
  );
}

import { NextResponse } from "next/server";
import { getSecurityHeaders } from "@/lib/api-middleware";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const response = {
    jsonapi: { version: "1.0" },
    meta: {
      apiVersion: "1.0",
      generatedAt: new Date().toISOString(),
      documentation: `${baseUrl}/api/docs`,
      termsOfService: `${baseUrl}/terms`,
      contact: {
        name: "WeduPay Support",
        email: "support@wedupay.com",
      },
    },
    data: {
      type: "api",
      id: "wedupay-v1",
      attributes: {
        name: "WeduPay API",
        description: "Mobile money payment API supporting EcoCash, M-Pesa, and MTN",
        version: "1.0.0",
        status: "stable",
      },
    },
    _links: {
      self: { href: `${baseUrl}/api/v1` },
      documentation: { href: `${baseUrl}/api/docs` },
      schemas: { href: `${baseUrl}/api/docs.json` },
    },
    collections: {
      payments: {
        href: `${baseUrl}/api/v1/payments`,
        methods: ["GET", "POST"],
        description: "Mobile money payments",
      },
      transfers: {
        href: `${baseUrl}/api/v1/transfers`,
        methods: ["GET", "POST"],
        description: "Wallet-to-wallet transfers",
      },
      transactions: {
        href: `${baseUrl}/api/v1/transactions`,
        methods: ["GET"],
        description: "Transaction history",
      },
      wallets: {
        href: `${baseUrl}/api/v1/wallets`,
        methods: ["GET"],
        description: "User wallets",
      },
      users: {
        href: `${baseUrl}/api/v1/users/{id}`,
        methods: ["GET"],
        description: "User resources",
        templated: true,
        subResources: {
          wallets: {
            href: `${baseUrl}/api/v1/users/{id}/wallets`,
            methods: ["GET"],
          },
          transactions: {
            href: `${baseUrl}/api/v1/users/{id}/transactions`,
            methods: ["GET"],
          },
        },
      },
    },
    webhooks: {
      mpesa: {
        href: `${baseUrl}/api/v1/webhooks/mpesa`,
        methods: ["GET", "POST"],
        description: "M-Pesa STK callback handler",
      },
      ecocash: {
        href: `${baseUrl}/api/v1/webhooks/ecocash`,
        methods: ["GET", "POST"],
        description: "EcoCash push payment handler",
      },
      mtn: {
        href: `${baseUrl}/api/v1/webhooks/mtn`,
        methods: ["GET", "POST"],
        description: "MTN collection callback handler",
      },
    },
    supportedHttpMethods: {
      GET: "Retrieve resources",
      POST: "Create new resources",
      PUT: "Update existing resources (idempotent)",
      DELETE: "Remove resources (soft delete)",
    },
    paginationParameters: ["page", "perPage", "sortBy", "sortOrder"],
    filterParameters: ["status", "type", "startDate", "endDate", "currency", "walletType"],
    rateLimits: {
      limit: 100,
      window: "1 minute",
      headers: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    },
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      ...getSecurityHeaders(),
    },
  });
}

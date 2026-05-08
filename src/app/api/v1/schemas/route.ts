import { NextResponse } from "next/server";
import { getSecurityHeaders } from "@/lib/api-middleware";

export async function GET() {
  const schemas = {
    payment: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        amount: { type: "number", minimum: 0.01 },
        currency: { type: "string", enum: ["USD", "ZMW", "ZWL", "KES", "GHS", "NGN", "TZS", "UGX", "MWK", "MZN", "RWF", "SLL", "XOF", "XAF"] },
        provider: { type: "string", enum: ["EcoCash", "M-Pesa", "MTN", "PawaPay"] },
        phoneNumber: { type: "string", pattern: "^\\+?[0-9]{9,15}$" },
        status: { type: "string", enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"] },
        reference: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
      required: ["amount", "currency", "provider", "phoneNumber"],
    },
    transfer: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        toUserId: { type: "string", format: "uuid" },
        amount: { type: "number", minimum: 0.01 },
        currency: { type: "string" },
        walletType: { type: "string", enum: ["EcoCash", "M-Pesa", "MTN", "PawaPay"] },
        status: { type: "string", enum: ["PENDING", "COMPLETED", "FAILED"] },
        reference: { type: "string" },
        description: { type: "string" },
      },
      required: ["toUserId", "amount", "currency", "walletType"],
    },
    transaction: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        userId: { type: "string", format: "uuid" },
        amount: { type: "number" },
        currency: { type: "string" },
        status: { type: "string" },
        type: { type: "string", enum: ["PAYMENT", "TRANSFER", "TRANSFER_RECEIVED", "FUNDING"] },
        reference: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    wallet: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        userId: { type: "string", format: "uuid" },
        walletType: { type: "string", enum: ["EcoCash", "M-Pesa", "MTN", "PawaPay"] },
        currency: { type: "string" },
        balance: { type: "number" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    user: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        email: { type: "string", format: "email" },
        phoneNumber: { type: "string" },
        country: { type: "string" },
        kycStatus: { type: "string", enum: ["PENDING", "VERIFIED", "REJECTED"] },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    error: {
      type: "object",
      properties: {
        error: {
          type: "object",
          properties: {
            code: { type: "string" },
            message: { type: "string" },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  target: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
            traceId: { type: "string", format: "uuid" },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["code", "message"],
        },
      },
      required: ["error"],
    },
    collection: {
      type: "object",
      properties: {
        data: { type: "array", items: {} },
        _links: {
          type: "object",
          properties: {
            self: { type: "object", properties: { href: { type: "string" } } },
            next: { type: "object", properties: { href: { type: "string" } } },
            prev: { type: "object", properties: { href: { type: "string" } } },
            first: { type: "object", properties: { href: { type: "string" } } },
            last: { type: "object", properties: { href: { type: "string" } } },
          },
        },
        _meta: {
          type: "object",
          properties: {
            page: { type: "integer" },
            perPage: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
  };

  const filterOperators = {
    comparison: [
      { operator: "eq", description: "Equal to", example: "status eq 'COMPLETED'" },
      { operator: "ne", description: "Not equal to", example: "status ne 'PENDING'" },
      { operator: "gt", description: "Greater than", example: "amount gt 100" },
      { operator: "ge", description: "Greater than or equal", example: "amount ge 50" },
      { operator: "lt", description: "Less than", example: "amount lt 1000" },
      { operator: "le", description: "Less than or equal", example: "amount le 500" },
    ],
    collection: [
      { operator: "in", description: "Value in list", example: "status in ['PENDING','COMPLETED']" },
      { operator: "nin", description: "Value not in list", example: "type nin ['PAYMENT']" },
    ],
    string: [
      { operator: "contains", description: "String contains", example: "reference contains 'TXN'" },
      { operator: "startsWith", description: "String starts with", example: "reference startsWith 'PAY'" },
      { operator: "endsWith", description: "String ends with", example: "reference endsWith '-2024'" },
    ],
  };

  const response = {
    schemas,
    filterOperators,
    resourceSchemas: {
      payment: `${schemas.payment}`,
      transfer: `${schemas.transfer}`,
      transaction: `${schemas.transaction}`,
      wallet: `${schemas.wallet}`,
      user: `${schemas.user}`,
    },
    _links: {
      self: { href: "/api/v1/schemas" },
      documentation: { href: "/api/docs" },
      openapi: { href: "/api/docs.json" },
    },
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      ...getSecurityHeaders(),
    },
  });
}

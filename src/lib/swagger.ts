import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "WeduPay API",
      version: "1.0.0",
      description: "Mobile money payment API for WeduPay platform supporting EcoCash, M-Pesa, and MTN",
      contact: {
        name: "WeduPay Support",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "WeduPay API v1",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "wedupay-user-id",
          description: "User authentication cookie",
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFound: {
          description: "Not Found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
      schemas: {
        Transaction: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            amount: { type: "number" },
            currency: { type: "string", example: "USD" },
            status: { type: "string", enum: ["PENDING", "COMPLETED", "FAILED"] },
            type: { type: "string", enum: ["PAYMENT", "TRANSFER", "TRANSFER_RECEIVED", "FUNDING"] },
            reference: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Wallet: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            walletType: { type: "string", enum: ["EcoCash", "M-Pesa", "MTN"] },
            currency: { type: "string", example: "USD" },
            balance: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        PaymentRequest: {
          type: "object",
          required: ["amount", "currency", "provider", "phoneNumber"],
          properties: {
            amount: { type: "number", minimum: 0.01, description: "Payment amount" },
            currency: { type: "string", example: "USD", description: "Currency code" },
            provider: { type: "string", enum: ["EcoCash", "M-Pesa", "MTN"], description: "Mobile money provider" },
            phoneNumber: { type: "string", description: "Customer phone number" },
            reference: { type: "string", description: "Optional payment reference" },
            description: { type: "string", description: "Optional payment description" },
          },
        },
        TransferRequest: {
          type: "object",
          required: ["toUserId", "amount", "currency", "walletType"],
          properties: {
            toUserId: { type: "string", format: "uuid", description: "Recipient user ID" },
            amount: { type: "number", minimum: 0.01, description: "Transfer amount" },
            currency: { type: "string", example: "USD" },
            walletType: { type: "string", enum: ["EcoCash", "M-Pesa", "MTN"] },
            description: { type: "string", description: "Optional transfer note" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            total: { type: "integer" },
            limit: { type: "integer" },
            offset: { type: "integer" },
            hasMore: { type: "boolean" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string" },
                details: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } },
                traceId: { type: "string", format: "uuid" },
              },
            },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: {} },
            links: {
              type: "object",
              properties: {
                self: { type: "string", format: "uri" },
                next: { type: "string", format: "uri" },
                prev: { type: "string", format: "uri" },
                first: { type: "string", format: "uri" },
                last: { type: "string", format: "uri" },
              },
            },
            meta: {
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
      },
    },
    tags: [
      { name: "Payments", description: "Mobile money payment operations" },
      { name: "Transfers", description: "Wallet-to-wallet transfer operations" },
      { name: "Transactions", description: "Transaction history and records" },
      { name: "Webhooks", description: "Mobile money provider callback endpoints" },
    ],
  },
  apis: ["./src/app/api/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

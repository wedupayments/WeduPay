import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "WeduPay API",
      version: "1.0.0",
      description: "Complete mobile money payment API for WeduPay platform supporting EcoCash, M-Pesa, MTN, and more",
      contact: {
        name: "WeduPay Support",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "WeduPay API v1 (Recommended)",
      },
      {
        url: "/api",
        description: "Legacy API endpoints",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "sb-access-token",
          description: "Supabase session authentication cookie",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API key authentication",
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
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            phoneNumber: { type: "string" },
            country: { type: "string", example: "KE" },
            kycStatus: { type: "string", enum: ["pending", "approved", "rejected"] },
            role: { type: "string", enum: ["USER", "MERCHANT", "ADMIN"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
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
            walletType: { type: "string", enum: ["EcoCash", "M-Pesa", "MTN", "mobile_wallet"] },
            currency: { type: "string", example: "USD" },
            balance: { type: "number" },
            availableBalance: { type: "number" },
            pendingBalance: { type: "number" },
            nickname: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ExchangeRate: {
          type: "object",
          properties: {
            from: { type: "string", example: "USD" },
            to: { type: "string", example: "KES" },
            rate: { type: "number", example: 129.50 },
            inverseRate: { type: "number", example: 0.0077 },
            source: { type: "string", example: "market" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ConversionResult: {
          type: "object",
          properties: {
            from: { type: "string", example: "USD" },
            to: { type: "string", example: "ZWL" },
            amount: { type: "number", example: 100 },
            convertedAmount: { type: "number", example: 32150.00 },
            rate: { type: "number", example: 321.50 },
            fee: { type: "number", example: 50.00 },
            totalAmount: { type: "number", example: 32200.00 },
            source: { type: "string" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ApiKey: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            key: { type: "string", description: "Masked API key" },
            permissions: { type: "array", items: { type: "string" } },
            isActive: { type: "boolean" },
            lastUsedAt: { type: "string", format: "date-time" },
            expiresAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Tenant: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            slug: { type: "string" },
            name: { type: "string" },
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
      { name: "Authentication", description: "User authentication and session management" },
      { name: "Payments", description: "Mobile money payment operations (M-Pesa, EcoCash, MTN)" },
      { name: "Transfers", description: "Wallet-to-wallet transfer operations" },
      { name: "Transactions", description: "Transaction history and records" },
      { name: "Wallets", description: "Wallet management and balance operations" },
      { name: "FX", description: "Foreign exchange and currency conversion" },
      { name: "Cards", description: "Virtual card operations" },
      { name: "Dashboard", description: "Dashboard data for customers and merchants" },
      { name: "Routing", description: "Intelligent payment routing" },
      { name: "Analytics", description: "Analytics and reporting" },
      { name: "API Keys", description: "API key management" },
      { name: "Tenants", description: "Multi-tenant management" },
      { name: "Waitlist", description: "Waitlist signup for customers and merchants" },
      { name: "KYC", description: "Know Your Customer verification" },
      { name: "Batch", description: "Batch operations" },
      { name: "Webhooks", description: "Mobile money provider callback endpoints" },
      { name: "Admin", description: "Administrative operations" },
    ],
    paths: {
      "/auth/session": {
        post: {
          tags: ["Authentication"],
          summary: "Create session",
          description: "Create a new user session with Supabase tokens",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["accessToken"],
                  properties: {
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                    expiresAt: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Session created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
        get: {
          tags: ["Authentication"],
          summary: "Get current session",
          description: "Retrieve the current user session",
          responses: {
            200: {
              description: "Session retrieved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Authentication"],
          summary: "Logout",
          description: "Delete the current session",
          responses: {
            200: {
              description: "Logged out successfully",
            },
          },
        },
      },
      "/fx/convert": {
        get: {
          tags: ["FX"],
          summary: "Convert currency",
          description: "Convert amount from one currency to another",
          parameters: [
            {
              name: "from",
              in: "query",
              required: true,
              schema: { type: "string", example: "USD" },
            },
            {
              name: "to",
              in: "query",
              required: true,
              schema: { type: "string", example: "KES" },
            },
            {
              name: "amount",
              in: "query",
              required: true,
              schema: { type: "number", example: 100 },
            },
          ],
          responses: {
            200: {
              description: "Conversion successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      conversion: { $ref: "#/components/schemas/ConversionResult" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/fx/rates": {
        get: {
          tags: ["FX"],
          summary: "Get exchange rates",
          description: "Get current exchange rates",
          parameters: [
            {
              name: "from",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "to",
              in: "query",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Rates retrieved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      rates: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ExchangeRate" },
                      },
                      count: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/wallets/balance": {
        get: {
          tags: ["Wallets"],
          summary: "Get wallet balance",
          description: "Get balance for specific currency or all wallets",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              name: "currency",
              in: "query",
              schema: { type: "string", example: "USD" },
            },
            {
              name: "all",
              in: "query",
              schema: { type: "boolean" },
            },
          ],
          responses: {
            200: {
              description: "Balance retrieved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { $ref: "#/components/schemas/Wallet" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/payments": {
        post: {
          tags: ["Payments"],
          summary: "Create payment",
          description: "Initiate a mobile money payment",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Payment initiated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      transactionId: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/transfers": {
        post: {
          tags: ["Transfers"],
          summary: "Create transfer",
          description: "Transfer funds between wallets",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TransferRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Transfer initiated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      transferId: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/transactions": {
        get: {
          tags: ["Transactions"],
          summary: "List transactions",
          description: "Get transaction history with pagination",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: {
            200: {
              description: "Transactions retrieved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      transactions: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Transaction" },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api-keys": {
        get: {
          tags: ["API Keys"],
          summary: "List API keys",
          description: "Get all API keys for authenticated user",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "perPage",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: {
            200: {
              description: "API keys retrieved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ApiKey" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["API Keys"],
          summary: "Create API key",
          description: "Generate a new API key",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    permissions: { type: "array", items: { type: "string" } },
                    expiresInDays: { type: "integer" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "API key created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ApiKey" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/analytics": {
        get: {
          tags: ["Analytics"],
          summary: "Get analytics",
          description: "Retrieve analytics data for specified period",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              name: "period",
              in: "query",
              schema: { type: "string", enum: ["24h", "7d", "30d", "90d"], default: "7d" },
            },
          ],
          responses: {
            200: {
              description: "Analytics retrieved",
            },
          },
        },
      },
      "/batch": {
        post: {
          tags: ["Batch"],
          summary: "Batch operations",
          description: "Execute multiple API operations in a single request (max 50)",
          security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["operations"],
                  properties: {
                    operations: {
                      type: "array",
                      maxItems: 50,
                      items: {
                        type: "object",
                        required: ["id", "method", "path"],
                        properties: {
                          id: { type: "string" },
                          method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"] },
                          path: { type: "string" },
                          body: { type: "object" },
                          params: { type: "object" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Batch executed",
            },
          },
        },
      },
      "/dashboard/customer": {
        get: {
          tags: ["Dashboard"],
          summary: "Get dashboard data",
          description: "Get dashboard data for authenticated user (works for both customers and merchants)",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "Dashboard data retrieved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      user: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          email: { type: "string" },
                          role: { type: "string", enum: ["USER", "MERCHANT", "ADMIN"] },
                        },
                      },
                      stats: {
                        type: "object",
                        properties: {
                          totalSpent: { type: "string" },
                          completedPayments: { type: "integer" },
                          pendingApprovals: { type: "integer" },
                          primaryMerchant: { type: "string" },
                        },
                      },
                      transactions: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Transaction" },
                      },
                      wallets: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Wallet" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/tenant/switch": {
        post: {
          tags: ["Tenants"],
          summary: "Switch tenant",
          description: "Switch active tenant context for multi-tenant users",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tenantSlug"],
                  properties: {
                    tenantSlug: { type: "string", example: "my-company" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Tenant switched successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      tenant: { $ref: "#/components/schemas/Tenant" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/tenant/memberships": {
        get: {
          tags: ["Tenants"],
          summary: "List tenant memberships",
          description: "Get all tenant memberships for authenticated user",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "Memberships retrieved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      memberships: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            tenantId: { type: "string" },
                            tenantSlug: { type: "string" },
                            tenantName: { type: "string" },
                            role: { type: "string" },
                            status: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/waitlist": {
        post: {
          tags: ["Waitlist"],
          summary: "Join waitlist",
          description: "Add email to waitlist (for customers or merchants)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "type"],
                  properties: {
                    email: { type: "string", format: "email" },
                    type: { type: "string", enum: ["CUSTOMER", "MERCHANT"] },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Added to waitlist",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      position: { type: "integer" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/cards": {
        get: {
          tags: ["Cards"],
          summary: "List virtual cards",
          description: "Get all virtual cards for authenticated user",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "Cards retrieved",
            },
          },
        },
        post: {
          tags: ["Cards"],
          summary: "Create virtual card",
          description: "Create a new virtual card",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["currency"],
                  properties: {
                    currency: { type: "string", example: "USD" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Card created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      cardId: { type: "string" },
                      status: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/mpesa": {
        post: {
          tags: ["Payments"],
          summary: "M-Pesa payment",
          description: "Initiate M-Pesa STK Push payment",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phoneNumber", "amount"],
                  properties: {
                    phoneNumber: { type: "string", example: "254712345678" },
                    amount: { type: "number", example: 100 },
                    currency: { type: "string", example: "KES" },
                    reference: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Payment initiated",
            },
          },
        },
      },
      "/ecocash": {
        post: {
          tags: ["Payments"],
          summary: "EcoCash payment",
          description: "Initiate EcoCash payment",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phoneNumber", "amount"],
                  properties: {
                    phoneNumber: { type: "string", example: "263771234567" },
                    amount: { type: "number", example: 10 },
                    currency: { type: "string", example: "USD" },
                    reference: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Payment initiated",
            },
          },
        },
      },
      "/mtn": {
        post: {
          tags: ["Payments"],
          summary: "MTN Mobile Money payment",
          description: "Initiate MTN Mobile Money payment",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phoneNumber", "amount"],
                  properties: {
                    phoneNumber: { type: "string", example: "256712345678" },
                    amount: { type: "number", example: 50 },
                    currency: { type: "string", example: "UGX" },
                    reference: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Payment initiated",
            },
          },
        },
      },
      "/webhooks/mpesa": {
        post: {
          tags: ["Webhooks"],
          summary: "M-Pesa webhook",
          description: "Receive M-Pesa payment callbacks",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    Body: {
                      type: "object",
                      properties: {
                        stkCallback: {
                          type: "object",
                          properties: {
                            MerchantRequestID: { type: "string" },
                            CheckoutRequestID: { type: "string" },
                            ResultCode: { type: "integer" },
                            ResultDesc: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Webhook received",
            },
          },
        },
      },
      "/webhooks/ecocash": {
        post: {
          tags: ["Webhooks"],
          summary: "EcoCash webhook",
          description: "Receive EcoCash payment callbacks",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    transactionId: { type: "string" },
                    reference: { type: "string" },
                    status: { type: "string" },
                    amount: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Webhook received",
            },
          },
        },
      },
        post: {
          tags: ["Routing"],
          summary: "Smart payment routing",
          description: "Automatically route payment to best provider",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount", "currency", "phoneNumber", "country", "reference"],
                  properties: {
                    amount: { type: "number" },
                    currency: { type: "string" },
                    phoneNumber: { type: "string" },
                    country: { type: "string" },
                    reference: { type: "string" },
                    routingStrategy: { type: "string", enum: ["LOWEST_FEE", "FASTEST", "HIGHEST_SUCCESS_RATE"] },
                    maxRetries: { type: "integer", minimum: 1, maximum: 5 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Payment routed successfully",
            },
          },
        },
        get: {
          tags: ["Routing"],
          summary: "Get fee quotes",
          description: "Get fee quotes from all providers",
          parameters: [
            {
              name: "amount",
              in: "query",
              required: true,
              schema: { type: "number" },
            },
            {
              name: "currency",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "country",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Fee quotes retrieved",
            },
          },
        },
      },
    },
  apis: ["./src/app/api/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

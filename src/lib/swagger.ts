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
      { name: "Users", description: "Consumer API: Personal wallets, cards, transactions, and P2P transfers" },
      { name: "Merchants", description: "Business API: Payment collection, links, analytics, and API keys" },
      { name: "Admins", description: "Platform API: User management, routing rules, and multi-tenant controls" },
      { name: "Public", description: "Publicly accessible endpoints (Waitlist, FX Rates)" },
      { name: "System", description: "System operations and webhooks" },
      { name: "Authentication", description: "All Roles: Session management" },
    ],
    paths: {
      "/transfers/p2p": {
        post: { tags: ["Users"], summary: "Peer-to-Peer Transfer", description: "Send funds directly to another user", security: [{ cookieAuth: [] }], responses: { 200: { description: "Transfer initiated" } } }
      },
      "/transfers/p2p/quote": {
        get: { tags: ["Users"], summary: "P2P Transfer Quote", description: "Get a quote (fees & fx) before sending a P2P transfer", security: [{ cookieAuth: [] }], responses: { 200: { description: "Quote generated" } } }
      },
      "/transfers/p2p/history": {
        get: { tags: ["Users"], summary: "P2P Transfer History", description: "View past peer-to-peer transfers", security: [{ cookieAuth: [] }], responses: { 200: { description: "History retrieved" } } }
      },
      "/wallets/fund": {
        post: { tags: ["Users"], summary: "Fund Wallet", description: "Deposit funds into your wallet using mobile money/card", security: [{ cookieAuth: [] }], responses: { 200: { description: "Deposit request initiated" } } }
      },
      "/wallets/withdraw": {
        post: { tags: ["Users"], summary: "Withdraw from Wallet", description: "Withdraw funds from your wallet to a mobile money account", security: [{ cookieAuth: [] }], responses: { 200: { description: "Withdrawal initiated" } } }
      },
      "/users/{id}/transactions": {
        get: { tags: ["Users"], summary: "User Transactions", description: "Get transaction history scoped to a specific user", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "User transactions retrieved" } } }
      },
      "/users/{id}/wallets": {
        get: { tags: ["Users"], summary: "User Wallets", description: "Get wallets scoped to a specific user", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "User wallets retrieved" } } }
      },
      "/webhooks/flutterwave": {
        post: { tags: ["System"], summary: "Flutterwave Webhook", description: "Incoming callback from Flutterwave", responses: { 200: { description: "Acknowledged" } } }
      },
      "/webhooks/paystack": {
        post: { tags: ["System"], summary: "Paystack Webhook", description: "Incoming callback from Paystack", responses: { 200: { description: "Acknowledged" } } }
      },
      "/webhooks/mtn": {
        post: { tags: ["System"], summary: "MTN Webhook", description: "Incoming callback from MTN Mobile Money", responses: { 200: { description: "Acknowledged" } } }
      },
      "/webhooks/endpoints": {
        get: { tags: ["Merchants"], summary: "List Webhook Endpoints", description: "List configured merchant webhook endpoints", security: [{ cookieAuth: [] }, { apiKeyAuth: [] }], responses: { 200: { description: "Endpoints retrieved" } } },
        post: { tags: ["Merchants"], summary: "Register Webhook Endpoint", description: "Create a new merchant webhook endpoint", security: [{ cookieAuth: [] }, { apiKeyAuth: [] }], responses: { 200: { description: "Endpoint created" } } }
      },
      "/webhooks/endpoints/{id}": {
        delete: { tags: ["Merchants"], summary: "Delete Webhook", description: "Remove a configured webhook receiver", security: [{ cookieAuth: [] }, { apiKeyAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Deleted" } } }
      },
      "/webhooks/deliveries": {
        get: { tags: ["Merchants"], summary: "Webhook Delivery Logs", description: "Access logs of sent webhooks and their delivery status", security: [{ cookieAuth: [] }, { apiKeyAuth: [] }], responses: { 200: { description: "Logs retrieved" } } }
      },
      "/analytics/revenue": {
        get: { tags: ["Merchants"], summary: "Revenue Analytics", description: "Get aggregated revenue data over time", security: [{ cookieAuth: [] }], responses: { 200: { description: "Data retrieved" } } }
      },
      "/analytics/payment-methods": {
        get: { tags: ["Merchants"], summary: "Payment Method Analytics", description: "Get distribution of payment methods used", security: [{ cookieAuth: [] }], responses: { 200: { description: "Data retrieved" } } }
      },
      "/analytics/success-rate": {
        get: { tags: ["Merchants"], summary: "Transaction Success Rate", description: "Get success vs failure rate of transactions", security: [{ cookieAuth: [] }], responses: { 200: { description: "Data retrieved" } } }
      },
      "/analytics/geography": {
        get: { tags: ["Merchants"], summary: "Geographic Analytics", description: "Get user transaction volume by country/region", security: [{ cookieAuth: [] }], responses: { 200: { description: "Data retrieved" } } }
      },
      "/admin/stats": {
        get: { tags: ["Admins"], summary: "Global Platform Stats", description: "High-level platform usage statistics", security: [{ cookieAuth: [] }], responses: { 200: { description: "Stats retrieved" } } }
      },
      "/admin/transfers": {
        get: { tags: ["Admins"], summary: "Global Transfer Audit", description: "Audit trail of all system transfers", security: [{ cookieAuth: [] }], responses: { 200: { description: "Transfers retrieved" } } }
      },
      "/routing/cross-border": {
        get: { tags: ["Admins"], summary: "Cross-Border Options", description: "List available corridors for cross-border routes", security: [{ cookieAuth: [] }], responses: { 200: { description: "Corridors retrieved" } } }
      },
      "/routing/health": {
        get: { tags: ["Admins"], summary: "Routing Engine Health", description: "Get status of all payment carrier networks", security: [{ cookieAuth: [] }], responses: { 200: { description: "Health retrieved" } } }
      },
      "/settlements": {
        get: {
          tags: ["Merchants"],
          summary: "List settlements",
          description: "Get settlement history and status",
          security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
          responses: {
            200: { description: "Settlements retrieved" }
          }
        },
        post: {
          tags: ["Merchants"],
          summary: "Request settlement",
          description: "Withdraw funds to connected bank account",
          security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
          responses: {
            200: { description: "Settlement initiated" }
          }
        }
      },
      "/exports": {
        get: {
          tags: ["Merchants"],
          summary: "List exports",
          description: "Get recent export jobs (CSV/Excel)",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "Exports retrieved" } }
        },
        post: {
          tags: ["Merchants"],
          summary: "Create export",
          description: "Queue asynchronous data export in the background",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "Export queued" } }
        }
      },
      "/kyc/submit": {
        post: {
          tags: ["Users"],
          summary: "Submit KYC documents",
          description: "Upload identity documents for verification",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "KYC submitted" } }
        }
      },
      "/kyc/status": {
        get: {
          tags: ["Users"],
          summary: "Check KYC status",
          description: "Get current identity verification status",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "KYC status retrieved" } }
        }
      },
      "/admin/users": {
        get: {
          tags: ["Admins"],
          summary: "List all users",
          description: "Admin: List users across platform",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "Users retrieved" } }
        }
      },
      "/routing/payment": {
        post: {
          tags: ["Admins"],
          summary: "Payment Routing Engine",
          description: "Intelligently route a payment based on fee analytics",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "Routed successfully" } }
        }
      },
      "/health": {
        get: {
          tags: ["Public"],
          summary: "Health Check",
          description: "Verify API is operational",
          responses: { 200: { description: "Healthy" } }
        }
      },
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
          tags: ["Public"],
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
          tags: ["Public"],
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
          tags: ["Users"],
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
          tags: ["Merchants"],
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
          tags: ["Users"],
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
          tags: ["Users"],
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
          tags: ["Merchants"],
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
          tags: ["Merchants"],
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
          tags: ["Merchants"],
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
          tags: ["Merchants"],
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
          tags: ["Users"],
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
          tags: ["Admins"],
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
          tags: ["Admins"],
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
          tags: ["Public"],
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
          tags: ["Users"],
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
          tags: ["Users"],
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
          tags: ["Merchants"],
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
          tags: ["Merchants"],
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
          tags: ["Merchants"],
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
          tags: ["System"],
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
          tags: ["System"],
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
          tags: ["Admins"],
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
          tags: ["Admins"],
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

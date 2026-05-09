import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "WeduPay API",
      version: "1.0.0",
      description: "Complete mobile money payment API for WeduPay platform supporting direct EcoCash for Zimbabwe and PawaPay-supported regional rails",
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
        LedgerEntry: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            transactionId: { type: "string", format: "uuid" },
            accountId: { type: "string" },
            entryType: { type: "string", enum: ["DEBIT", "CREDIT"] },
            amount: { type: "number" },
            currency: { type: "string", example: "USD" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
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
            status: { type: "string", enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] },
            type: { type: "string", enum: ["PAYMENT", "TRANSFER", "TRANSFER_RECEIVED", "FUNDING", "WITHDRAWAL", "P2P_TRANSFER"] },
            reference: { type: "string" },
            metadata: { type: "object", description: "Additional context — for P2P_TRANSFER includes recipientPhone, recipientCountry, receiveAmount, receiveCurrency, exchangeRate" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        P2PTransferFees: {
          type: "object",
          properties: {
            transferFee: { type: "number", description: "Tiered fee on send amount (0.5%–2%)" },
            fxFee: { type: "number", description: "FX conversion fee embedded in target amount (1%)" },
            totalFees: { type: "number", description: "transferFee + fxFee" },
          },
        },
        P2PTransferQuote: {
          type: "object",
          properties: {
            sendAmount: { type: "number", example: 5000 },
            sendCurrency: { type: "string", example: "KES" },
            receiveAmount: { type: "number", example: 91875 },
            receiveCurrency: { type: "string", example: "TZS" },
            exchangeRate: { type: "number", example: 19.45 },
            fees: { $ref: "#/components/schemas/P2PTransferFees" },
            totalDebit: { type: "number", example: 5125, description: "sendAmount + totalFees — this is the amount debited from the sender's wallet" },
            estimatedDelivery: { type: "string", example: "Instant" },
            route: {
              type: "object",
              properties: {
                provider: { type: "string", example: "flutterwave" },
                fxRoute: { type: "string", enum: ["direct", "via_usd", "via_eur"] },
              },
            },
          },
        },
        P2PTransferRecord: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            transferRef: { type: "string", example: "P2P-1714567890-abc" },
            status: { type: "string", enum: ["PROCESSING", "COMPLETED", "FAILED", "PENDING_REVIEW"], description: "FAILED means wallet was refunded; PENDING_REVIEW means funds are held" },
            sendAmount: { type: "number" },
            sendCurrency: { type: "string" },
            receiveAmount: { type: "number" },
            receiveCurrency: { type: "string" },
            exchangeRate: { type: "number" },
            totalDebit: { type: "number" },
            recipientPhone: { type: "string" },
            recipientName: { type: "string" },
            recipientCountry: { type: "string" },
            providerReference: { type: "string" },
            failureReason: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            completedAt: { type: "string", format: "date-time" },
          },
        },
        Wallet: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            walletType: { type: "string", enum: ["EcoCash", "M-Pesa", "MTN", "PawaPay", "mobile_wallet"] },
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
            provider: { type: "string", enum: ["EcoCash", "M-Pesa", "MTN", "PawaPay"], description: "Mobile money provider" },
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
            walletType: { type: "string", enum: ["EcoCash", "M-Pesa", "MTN", "PawaPay"] },
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
      "/auth/create-user": { post: { tags: ["Authentication"], summary: "Create User Profile", description: "Initialize user profile post-auth", security: [{ cookieAuth: [] }], responses: { 200: { description: "User created" } } } },
      "/auth/sync-profile": { post: { tags: ["Authentication"], summary: "Sync Profile", description: "Synchronize local profile with Auth provider", security: [{ cookieAuth: [] }], responses: { 200: { description: "Synced" } } } },
      "/auth/user": { get: { tags: ["Authentication"], summary: "Get Configured User", description: "Get the localized state of the current user", security: [{ cookieAuth: [] }], responses: { 200: { description: "User" } } } },
      "/auth/health": { get: { tags: ["Public"], summary: "Auth DB Health", description: "Ping Supabase/Auth connection", responses: { 200: { description: "Healthy" } } } },
      "/cards/{id}": { get: { tags: ["Users"], summary: "Get Virtual Card", description: "Retrieve specific virtual card data", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Card details" } } } },
      "/cards/{id}/fund": { post: { tags: ["Users"], summary: "Fund Virtual Card", description: "Move wallet funds to virtual card", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Card funded" } } } },
      "/dashboard/merchant": { get: { tags: ["Merchants"], summary: "Merchant Dashboard", description: "High level merchant volume view", security: [{ cookieAuth: [] }], responses: { 200: { description: "Dashboard stats" } } } },
      "/merchant/payment-links": { get: { tags: ["Merchants"], summary: "Payment Links", description: "List reusable payment links", security: [{ cookieAuth: [] }], responses: { 200: { description: "Links" } } }, post: { tags: ["Merchants"], summary: "Create Link", description: "Create payment link", security: [{ cookieAuth: [] }], responses: { 200: { description: "Link created" } } } },
      "/merchant/payment-links/{id}": { get: { tags: ["Merchants"], summary: "Get Link", description: "Get specific link details", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Link retrieved" } } } },
      "/merchant/payments": { get: { tags: ["Merchants"], summary: "Merchant Payments", description: "List business volume payments", security: [{ cookieAuth: [] }], responses: { 200: { description: "Payments" } } } },
      "/merchant/transactions": { get: { tags: ["Merchants"], summary: "Merchant Transactions", description: "Track customer transaction logs", security: [{ cookieAuth: [] }], responses: { 200: { description: "Transactions" } } } },
      "/merchant/transactions/stats": { get: { tags: ["Merchants"], summary: "Merchant Txn Stats", description: "Aggregate transaction logic", security: [{ cookieAuth: [] }], responses: { 200: { description: "Stats" } } } },
      "/mpesa/status/{checkoutRequestId}": { get: { tags: ["System"], summary: "M-Pesa Native Status", description: "Check direct carrier callback status", security: [{ cookieAuth: [] }], parameters: [{ name: "checkoutRequestId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Status check" } } } },
      "/ecocash/status/{reference}": { get: { tags: ["System"], summary: "EcoCash Native Status", description: "Check direct carrier callback status", security: [{ cookieAuth: [] }], parameters: [{ name: "reference", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Status check" } } } },
      "/mtn/status/{referenceId}": { get: { tags: ["System"], summary: "MTN Native Status", description: "Check direct carrier callback status", security: [{ cookieAuth: [] }], parameters: [{ name: "referenceId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Status check" } } } },
      "/payment-references": { get: { tags: ["Users"], summary: "List Payment References", description: "Resolve pending references", security: [{ cookieAuth: [] }], responses: { 200: { description: "References" } } } },
      "/waitlist/list": { get: { tags: ["Admins"], summary: "Waitlist Database", description: "List all waitlist subscribers", security: [{ cookieAuth: [] }], responses: { 200: { description: "Waitlist" } } } },
      "/wallets/{id}": { get: { tags: ["Users"], summary: "Get Specific Wallet", description: "Get specific wallet context", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Wallet" } } } },
      "/users": { get: { tags: ["Admins"], summary: "General Users Search", description: "General user search list query API", security: [{ cookieAuth: [] }], responses: { 200: { description: "Users" } } } },
      "/options": { get: { tags: ["Public"], summary: "Configuration Options", description: "Read public configuration options", security: [], responses: { 200: { description: "Options" } } } },
      "/api-keys/{id}": {
        delete: { tags: ["Merchants"], summary: "Revoke API Key", description: "Delete an API key by ID", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Deleted" } } }
      },
      "/exports/{id}": {
        get: { tags: ["Merchants"], summary: "Get Export Status", description: "Check status of an export job", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Status retrieved" } } }
      },
      "/exports/{id}/download": {
        get: { tags: ["Merchants"], summary: "Download Export", description: "Download a completed export file", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "File download" } } }
      },
      "/notifications/preferences": {
        get: { tags: ["Users"], summary: "Notification Preferences", description: "Get user email and SMS preferences", security: [{ cookieAuth: [] }], responses: { 200: { description: "Preferences retrieved" } } },
        put: { tags: ["Users"], summary: "Update Preferences", description: "Update notification settings", security: [{ cookieAuth: [] }], responses: { 200: { description: "Updated" } } }
      },
      "/tasks": {
        get: { tags: ["System"], summary: "List Async Tasks", description: "List background processing tasks", security: [{ cookieAuth: [] }], responses: { 200: { description: "Tasks retrieved" } } }
      },
      "/tasks/{id}": {
        get: { tags: ["System"], summary: "Task Status", description: "Get status of an async task", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Task retrieved" } } }
      },
      "/payments/{id}": {
        get: { tags: ["Users"], summary: "Get Payment Details", description: "Retrieve info for specific payment", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Payment retrieved" } } }
      },
      "/transfers/{id}": {
        get: { tags: ["Users"], summary: "Get Transfer Details", description: "Retrieve info for specific transfer", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Transfer retrieved" } } }
      },
      "/transfers/p2p/recipients": {
        get: {
          tags: ["Users"],
          summary: "List saved recipients",
          description: "List saved P2P transfer recipients for the authenticated user",
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: "Recipients retrieved" } },
        },
        post: {
          tags: ["Users"],
          summary: "Save recipient",
          description: "Manually save a recipient for future P2P transfers",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phone", "country"],
                  properties: {
                    phone: { type: "string", example: "255712345678" },
                    country: { type: "string", example: "TZ" },
                    name: { type: "string", example: "John Doe" },
                    walletType: { type: "string", default: "mobile_wallet" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Recipient saved" } },
        },
        delete: {
          tags: ["Users"],
          summary: "Remove recipient",
          description: "Delete a saved recipient by ID",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "id", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { 200: { description: "Recipient removed" } },
        },
      },
      "/transfers/p2p/{ref}": {
        get: { tags: ["Users"], summary: "P2P Reference Details", description: "Get specific P2P reference payload", security: [{ cookieAuth: [] }], parameters: [{ name: "ref", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Details retrieved" } } }
      },
      "/admin/compliance/{ref}": {
        get: { tags: ["Admins"], summary: "Compliance Check", description: "Admin review of flagged transfer", security: [{ cookieAuth: [] }], parameters: [{ name: "ref", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Data retrieved" } } }
      },
      "/routing/health/{providerId}": {
        get: { tags: ["Admins"], summary: "Provider Health", description: "Get deep health metrics for provider", security: [{ cookieAuth: [] }], parameters: [{ name: "providerId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Health retrieved" } } }
      },
      "/users/{id}": {
        get: { tags: ["Admins"], summary: "Get User Data", description: "Get specific user profile (Admin)", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Profile retrieved" } } }
      },
      "/wallets": {
        get: { tags: ["Users"], summary: "List All Wallets", description: "List all wallets belonging to user", security: [{ cookieAuth: [] }], responses: { 200: { description: "Wallets retrieved" } } }
      },
      "/wallets/history": {
        get: { tags: ["Users"], summary: "Global Wallet History", description: "Transaction history for all wallets", security: [{ cookieAuth: [] }], responses: { 200: { description: "History retrieved" } } }
      },
      "/webhooks/endpoints/{id}/regenerate-secret": {
        post: { tags: ["Merchants"], summary: "Regenerate Webhook Secret", description: "Roll the webhook singing secret", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Secret regenerated" } } }
      },
      "/schemas": {
        get: { tags: ["Public"], summary: "OpenAPI JSON Definition", description: "Download dynamic OpenAPI schema natively", responses: { 200: { description: "Schema JSON" } } }
      },
      "/settlements/balance": {
        get: { tags: ["Merchants"], summary: "Settlement Balance", description: "Check balance available for settling", security: [{ cookieAuth: [] }], responses: { 200: { description: "Balance retrieved" } } }
      },
      "/settlements/request": {
        post: { tags: ["Merchants"], summary: "New Settlement Request", description: "Alias for requesting a new settlement", security: [{ cookieAuth: [] }], responses: { 200: { description: "Settlement registered" } } }
      },
      "/settlements/{id}": {
        get: { tags: ["Merchants"], summary: "Get Settlement Details", description: "Get exact status of withdrawal", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Settlement retrieved" } } }
      },
      "/transfers/p2p": {
        post: {
          tags: ["Users"],
          summary: "Execute P2P Transfer",
          description: "Send funds cross-border to a recipient's mobile wallet. Atomically debits sender wallet, creates transfer record and transaction ledger entry. Auto-refunds on provider failure.",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sendAmount", "sendCurrency", "recipientPhone", "recipientCountry"],
                  properties: {
                    sendAmount: { type: "number", minimum: 1, example: 5000, description: "Amount to send in sendCurrency" },
                    sendCurrency: { type: "string", example: "KES", description: "3-letter ISO currency code" },
                    recipientPhone: { type: "string", minLength: 10, example: "255712345678", description: "Recipient phone number with country code" },
                    recipientCountry: { type: "string", example: "TZ", description: "ISO 3166-1 alpha-2 country code" },
                    recipientName: { type: "string", example: "John Doe" },
                    recipientWalletType: { type: "string", default: "mobile_wallet" },
                    description: { type: "string", example: "Family support" },
                    saveRecipient: { type: "boolean", default: false, description: "Persist recipient for future transfers" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Transfer result — check transfer.status for outcome",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      requestId: { type: "string" },
                      transfer: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          reference: { type: "string", example: "P2P-1714567890-abc" },
                          status: { type: "string", enum: ["COMPLETED", "FAILED", "PENDING_REVIEW"], description: "FAILED = wallet refunded; PENDING_REVIEW = funds held for compliance" },
                          message: { type: "string", nullable: true },
                        },
                      },
                      recipient: { type: "object", properties: { phone: { type: "string" }, country: { type: "string" } } },
                      amount: { type: "object", properties: { send: { type: "number" }, receive: { type: "number" }, currency: { type: "string" } } },
                      delivery: { type: "object", properties: { estimated: { type: "string" }, providerReference: { type: "string" } } },
                    },
                  },
                },
              },
            },
            400: { $ref: "#/components/responses/BadRequest" },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/transfers/p2p/quote": {
        post: {
          tags: ["Users"],
          summary: "P2P Transfer Quote",
          description: "Get FX rate, fees, and total debit for a prospective transfer. Does not move any money or create any records. Quote is advisory — live rate is re-fetched at execution.",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sendAmount", "sendCurrency", "recipientPhone", "recipientCountry"],
                  properties: {
                    sendAmount: { type: "number", minimum: 1, example: 5000 },
                    sendCurrency: { type: "string", example: "KES" },
                    recipientPhone: { type: "string", example: "255712345678" },
                    recipientCountry: { type: "string", example: "TZ" },
                    recipientName: { type: "string" },
                    recipientWalletType: { type: "string", default: "mobile_wallet" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Quote generated — valid for 10 minutes",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      quote: { $ref: "#/components/schemas/P2PTransferQuote" },
                      limits: {
                        type: "object",
                        properties: {
                          transactionMin: { type: "number" },
                          transactionMax: { type: "number" },
                          dailyMax: { type: "number" },
                          kycRequired: { type: "boolean" },
                        },
                      },
                      validFor: { type: "integer", example: 600, description: "Quote validity in seconds" },
                    },
                  },
                },
              },
            },
            400: { $ref: "#/components/responses/BadRequest" },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/transfers/p2p/history": {
        get: {
          tags: ["Users"],
          summary: "P2P Transfer History",
          description: "Paginated list of past P2P transfers for the authenticated user",
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "status", in: "query", schema: { type: "string", enum: ["COMPLETED", "FAILED", "PENDING_REVIEW", "PROCESSING"] } },
          ],
          responses: {
            200: {
              description: "Transfer history",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      transfers: { type: "array", items: { $ref: "#/components/schemas/P2PTransferRecord" } },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          total: { type: "integer" },
                          totalPages: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/wallets/fund": {
        post: { tags: ["Users"], summary: "Fund Wallet", description: "Deposit funds into your wallet using mobile money/card", security: [{ cookieAuth: [] }], responses: { 200: { description: "Deposit request initiated" } } }
      },
      "/wallets/withdraw": {
        post: { tags: ["Users"], summary: "Withdraw from Wallet", description: "Withdraw funds from your wallet to a mobile money account", security: [{ cookieAuth: [] }], responses: { 200: { description: "Withdrawal initiated" } } }
      },
      "/ledger/entries": {
        post: {
          tags: ["System"],
          summary: "Create Ledger Entries",
          description: "Create double-entry ledger lines for a transaction",
          security: [{ apiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    transactionId: { type: "string", format: "uuid" },
                    debits: { type: "array", items: { $ref: "#/components/schemas/LedgerEntry" } },
                    credits: { type: "array", items: { $ref: "#/components/schemas/LedgerEntry" } },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Ledger entries created" } },
        },
      },
      "/ledger/transactions/{id}": {
        get: {
          tags: ["System"],
          summary: "Get Transaction Ledger",
          description: "Retrieve ledger entries for a transaction and verification status",
          security: [{ apiKeyAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Ledger entries", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/LedgerEntry" } }, verification: { type: "object" } } } } } } },
        },
      },
      "/ledger/accounts/{accountId}": {
        get: {
          tags: ["System"],
          summary: "Get Account Statement",
          description: "Get account ledger statement for a specific account and currency",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "accountId", in: "path", required: true, schema: { type: "string" } }, { name: "currency", in: "query", required: false, schema: { type: "string" } }],
          responses: { 200: { description: "Account statement" } },
        },
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
      "/webhooks/pawapay": {
        post: { tags: ["System"], summary: "PawaPay Webhook", description: "Incoming callback from PawaPay deposits, payouts, and refunds", responses: { 200: { description: "Acknowledged" } } }
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
    },
  },
  apis: ["./src/app/api/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

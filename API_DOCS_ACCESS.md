# Accessing API Documentation

## URLs

### Development (Localhost)
```
http://localhost:3000/api/docs
```

### Production (Vercel)
```
https://wedu-pay.vercel.app/api/docs
```

## What You'll Find

The API documentation is built with Swagger UI and provides:

- **Interactive API Explorer** - Test endpoints directly from the browser
- **Request/Response Examples** - See sample payloads
- **Authentication Guide** - How to authenticate API requests
- **Endpoint Descriptions** - Detailed documentation for each endpoint
- **Schema Definitions** - Data models and validation rules

## API Endpoints Documented

### Authentication
- `POST /api/auth/session` - Create session
- `DELETE /api/auth/session` - Destroy session
- `GET /api/auth/user` - Get user profile
- `PUT /api/auth/user` - Update user profile

### Wallets
- `GET /api/v1/wallets/balance` - Get wallet balances
- `POST /api/v1/wallets/withdraw` - Withdraw funds
- `GET /api/v1/wallets` - List all wallets

### Payments
- `POST /api/v1/payments` - Create payment
- `GET /api/v1/payments/{id}` - Get payment status
- `GET /api/v1/payments` - List payments

### Transfers
- `POST /api/v1/transfers` - Create transfer
- `GET /api/v1/transfers/{id}` - Get transfer status
- `GET /api/v1/transfers` - List transfers

### KYC
- `GET /api/v1/kyc/status` - Get KYC status
- `POST /api/v1/kyc/submit` - Submit KYC documents

### Cards
- `GET /api/cards` - List virtual cards
- `POST /api/cards` - Create virtual card
- `GET /api/cards/{id}` - Get card details

### Transactions
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/{id}` - Get transaction details

### Webhooks
- `POST /api/v1/webhooks/mpesa` - M-Pesa webhook
- `POST /api/v1/webhooks/flutterwave` - Flutterwave webhook
- `POST /api/v1/webhooks/paystack` - Paystack webhook

## OpenAPI Specification

You can also access the raw OpenAPI/Swagger JSON:

```
https://wedu-pay.vercel.app/api/docs.json
```

This is useful for:
- Importing into Postman
- Generating client SDKs
- API testing tools
- Documentation generators

## Authentication for API Calls

### Option 1: Cookie-based (Browser)
When logged in through the web app, your session cookies are automatically included.

### Option 2: Bearer Token (API)
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://wedu-pay.vercel.app/api/v1/wallets/balance
```

### Option 3: API Key (Server-to-Server)
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://wedu-pay.vercel.app/api/v1/payments
```

## Testing Endpoints

### Using Swagger UI
1. Go to `/api/docs`
2. Click on an endpoint
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"

### Using cURL
```bash
# Get wallet balance
curl https://wedu-pay.vercel.app/api/v1/wallets/balance?all=true \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create payment
curl -X POST https://wedu-pay.vercel.app/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 1000,
    "currency": "KES",
    "provider": "MPESA",
    "phoneNumber": "+254712345678"
  }'
```

### Using Postman
1. Import the OpenAPI spec: `https://wedu-pay.vercel.app/api/docs.json`
2. Set up authentication (Bearer token or API key)
3. Test endpoints

## API Versioning

The API uses URL-based versioning:

- **v1** (Current): `/api/v1/*`
- Legacy endpoints: `/api/*` (deprecated, use v1)

## Rate Limits

Default rate limits per endpoint:
- Authentication: 10 requests/minute
- Payments: 30 requests/minute
- Transfers: 30 requests/minute
- Cards: 20 requests/minute
- General API: 100 requests/minute

## Support

For API support:
- Check the documentation at `/api/docs`
- Review error responses (include `traceId` when reporting issues)
- Contact: support@wedupay.com

## Quick Links

- **API Docs**: https://wedu-pay.vercel.app/api/docs
- **OpenAPI Spec**: https://wedu-pay.vercel.app/api/docs.json
- **API Root**: https://wedu-pay.vercel.app/api/v1
- **Health Check**: https://wedu-pay.vercel.app/api/v1/health

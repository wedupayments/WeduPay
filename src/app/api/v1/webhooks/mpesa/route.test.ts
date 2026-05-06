import { POST } from "@/app/api/v1/webhooks/mpesa/route";
import { processWebhook } from "@/services/webhook/webhook.processor";

jest.mock("@/services/webhook/webhook.processor", () => ({
  processWebhook: jest.fn(),
}));

function makeRequest(body: Record<string, unknown>, headers?: HeadersInit) {
  return new Request("http://localhost:3000/api/v1/webhooks/mpesa", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/webhooks/mpesa", () => {
  const originalSecret = process.env.MPESA_WEBHOOK_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MPESA_WEBHOOK_SECRET;
  });

  afterAll(() => {
    process.env.MPESA_WEBHOOK_SECRET = originalSecret;
  });

  it("rejects requests with an invalid configured webhook secret", async () => {
    process.env.MPESA_WEBHOOK_SECRET = "expected-secret";

    const response = await POST(
      makeRequest(
        {
          Body: {
            stkCallback: {
              MerchantRequestID: "merchant-123",
              CheckoutRequestID: "ws_CO_123",
              ResultCode: 0,
              ResultDesc: "Success",
            },
          },
        },
        { "x-mpesa-signature": "wrong-secret" }
      ) as never
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.received).toBe(false);
    expect(processWebhook).not.toHaveBeenCalled();
  });

  it("processes a valid M-Pesa callback payload", async () => {
    process.env.MPESA_WEBHOOK_SECRET = "expected-secret";
    (processWebhook as jest.Mock).mockResolvedValue({
      success: true,
      message: "Webhook processed successfully",
    });

    const payload = {
      Body: {
        stkCallback: {
          MerchantRequestID: "merchant-123",
          CheckoutRequestID: "ws_CO_123",
          ResultCode: 0,
          ResultDesc: "The service request is processed successfully.",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 500 },
              { Name: "MpesaReceiptNumber", Value: "QWE123XYZ" },
            ],
          },
        },
      },
    };

    const response = await POST(
      makeRequest(payload, { authorization: "Bearer expected-secret" }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(processWebhook).toHaveBeenCalledWith("mpesa", payload);
  });

  it("rejects payloads without stkCallback data", async () => {
    const response = await POST(makeRequest({ Body: {} }) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.received).toBe(false);
    expect(processWebhook).not.toHaveBeenCalled();
  });
});

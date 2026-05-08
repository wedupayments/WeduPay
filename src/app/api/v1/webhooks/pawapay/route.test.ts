import { POST } from "@/app/api/v1/webhooks/pawapay/route";
import { processWebhook } from "@/services/webhook/webhook.processor";

jest.mock("@/services/webhook/webhook.processor", () => ({
  processWebhook: jest.fn(),
}));

function makeRequest(body: Record<string, unknown>, headers?: HeadersInit) {
  return new Request("http://localhost:3000/api/v1/webhooks/pawapay", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/webhooks/pawapay", () => {
  const originalSecret = process.env.PAWAPAY_WEBHOOK_SECRET;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PAWAPAY_WEBHOOK_SECRET;
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    process.env.PAWAPAY_WEBHOOK_SECRET = originalSecret;
  });

  it("rejects requests with an invalid configured webhook secret", async () => {
    process.env.PAWAPAY_WEBHOOK_SECRET = "expected-secret";

    const response = await POST(makeRequest(
      { depositId: "dep-123", status: "COMPLETED" },
      { "x-pawapay-signature": "wrong-secret" }
    ));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.received).toBe(false);
    expect(processWebhook).not.toHaveBeenCalled();
  });

  it("processes a valid PawaPay deposit webhook payload", async () => {
    process.env.PAWAPAY_WEBHOOK_SECRET = "expected-secret";
    (processWebhook as jest.Mock).mockResolvedValue({
      success: true,
      message: "Webhook processed successfully",
    });

    const payload = {
      depositId: "dep-123",
      status: "COMPLETED",
      amount: "25",
      currency: "ZMW",
      correspondent: "AIRTEL_ZMB",
      metadata: [
        { fieldName: "reference", fieldValue: "ORDER-123" },
      ],
    };

    const response = await POST(makeRequest(
      payload,
      { authorization: "Bearer expected-secret" }
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(processWebhook).toHaveBeenCalledWith("pawapay", payload);
  });

  it("processes payout callbacks too", async () => {
    (processWebhook as jest.Mock).mockResolvedValue({
      success: true,
      message: "Webhook processed successfully",
    });

    const payload = {
      payoutId: "payout-123",
      status: "COMPLETED",
      amount: "15",
      currency: "GHS",
    };

    const response = await POST(makeRequest(payload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(processWebhook).toHaveBeenCalledWith("pawapay", payload);
  });

  it("rejects payloads without any usable PawaPay transaction id", async () => {
    const response = await POST(makeRequest({ status: "COMPLETED" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.received).toBe(false);
    expect(processWebhook).not.toHaveBeenCalled();
  });

  it("returns 400 when the shared webhook processor rejects the event", async () => {
    (processWebhook as jest.Mock).mockResolvedValue({
      success: false,
      error: "Transaction not found",
    });

    const response = await POST(makeRequest({
      depositId: "dep-404",
      status: "FAILED",
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.received).toBe(false);
    expect(body.error).toBe("Transaction not found");
  });
});

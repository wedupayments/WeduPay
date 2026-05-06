import { POST } from "@/app/api/v1/webhooks/ecocash/route";
import { processWebhook } from "@/services/webhook/webhook.processor";

jest.mock("@/services/webhook/webhook.processor", () => ({
  processWebhook: jest.fn(),
}));

function makeRequest(body: Record<string, unknown>, headers?: HeadersInit) {
  return new Request("http://localhost:3000/api/v1/webhooks/ecocash", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/webhooks/ecocash", () => {
  const originalSecret = process.env.ECOCASH_WEBHOOK_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ECOCASH_WEBHOOK_SECRET;
  });

  afterAll(() => {
    process.env.ECOCASH_WEBHOOK_SECRET = originalSecret;
  });

  it("rejects requests with an invalid configured webhook secret", async () => {
    process.env.ECOCASH_WEBHOOK_SECRET = "expected-secret";

    const response = await POST(makeRequest(
      { reference: "EC-REF-123", status: "SUCCESS" },
      { "x-ecocash-signature": "wrong-secret" }
    ));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.received).toBe(false);
    expect(processWebhook).not.toHaveBeenCalled();
  });

  it("processes a valid EcoCash webhook payload", async () => {
    process.env.ECOCASH_WEBHOOK_SECRET = "expected-secret";
    (processWebhook as jest.Mock).mockResolvedValue({
      success: true,
      message: "Webhook processed successfully",
    });

    const payload = {
      reference: "EC-REF-123",
      ecocashReference: "ECO-123",
      status: "SUCCESS",
      amount: 10,
      currency: "USD",
    };

    const response = await POST(makeRequest(
      payload,
      { authorization: "Bearer expected-secret" }
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(processWebhook).toHaveBeenCalledWith("ecocash", payload);
  });

  it("rejects payloads without any usable EcoCash reference", async () => {
    const response = await POST(makeRequest({ status: "SUCCESS" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.received).toBe(false);
    expect(processWebhook).not.toHaveBeenCalled();
  });
});

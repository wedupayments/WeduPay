import { PawaPayAPI } from "@/lib/pawapay";

const mockFetch = jest.fn();
const originalRandomUUID = global.crypto.randomUUID;

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const status = init.status || 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

function makeApi(overrides: Partial<ConstructorParameters<typeof PawaPayAPI>[0]> = {}) {
  return new PawaPayAPI({
    apiToken: "test-pawapay-token",
    environment: "sandbox",
    baseUrl: "https://api.sandbox.pawapay.io",
    ...overrides,
  });
}

describe("PawaPayAPI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
    global.crypto.randomUUID = jest.fn(() => "11111111-1111-4111-8111-111111111111");
  });

  afterAll(() => {
    global.crypto.randomUUID = originalRandomUUID;
  });

  describe("phone numbers", () => {
    it.each([
      ["+260 97 123 4567", "260971234567"],
      ["00260 97 123 4567", "260971234567"],
      ["260971234567", "260971234567"],
    ])("formats %s as %s", (input, expected) => {
      expect(makeApi().formatPhoneNumber(input)).toBe(expected);
    });

    it.each(["260971234567", "+233241234567", "254712345678"])(
      "accepts regional MSISDN %s",
      (phone) => {
        expect(makeApi().validatePhoneNumber(phone)).toBe(true);
      }
    );

    it.each(["12345", "", "+12"])("rejects invalid MSISDN %s", (phone) => {
      expect(makeApi().validatePhoneNumber(phone)).toBe(false);
    });
  });

  describe("predictProvider", () => {
    it("posts a provider prediction request", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        correspondent: "AIRTEL_ZMB",
        country: "ZMB",
      }));

      const result = await makeApi().predictProvider({
        phoneNumber: "+260 97 123 4567",
        country: "ZM",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.sandbox.pawapay.io/v2/predict-provider",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-pawapay-token",
            Accept: "application/json",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            msisdn: "260971234567",
            country: "ZM",
          }),
        })
      );
      expect(result).toEqual(expect.objectContaining({
        status: "SUCCESS",
        provider: "AIRTEL_ZMB",
        country: "ZMB",
      }));
    });

    it("returns a failed response when credentials are missing", async () => {
      const result = await makeApi({ apiToken: "" }).predictProvider({
        phoneNumber: "+260971234567",
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: "FAILED",
        message: "PawaPay API token is not configured",
      });
    });
  });

  describe("initiateDeposit", () => {
    it("predicts provider then creates a deposit", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ correspondent: "AIRTEL_ZMB" }))
        .mockResolvedValueOnce(jsonResponse({
          status: "ACCEPTED",
          depositId: "11111111-1111-4111-8111-111111111111",
          providerReference: "PWP-123",
        }));

      const result = await makeApi().initiateDeposit({
        phoneNumber: "+260 97 123 4567",
        amount: 10,
        currency: "ZMW",
        reference: "ORDER-123",
        description: "School fee payment",
        callbackUrl: "https://example.com/api/v1/webhooks/pawapay",
        country: "ZM",
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0]).toBe("https://api.sandbox.pawapay.io/v2/deposits");
      const depositBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(mockFetch.mock.calls[1][1]).toEqual(expect.objectContaining({
        method: "POST",
      }));
      expect(depositBody).toEqual({
        depositId: "11111111-1111-4111-8111-111111111111",
        amount: "10",
        currency: "ZMW",
        correspondent: "AIRTEL_ZMB",
        payer: {
          type: "MSISDN",
          address: {
            value: "260971234567",
          },
        },
        statementDescription: "School fee payment",
        customerTimestamp: expect.any(String),
        callbackUrl: "https://example.com/api/v1/webhooks/pawapay",
        metadata: [
          { fieldName: "reference", fieldValue: "ORDER-123" },
          { fieldName: "description", fieldValue: "School fee payment" },
        ],
      });
      expect(result).toEqual(expect.objectContaining({
        status: "SUCCESS",
        transactionId: "11111111-1111-4111-8111-111111111111",
        providerReference: "PWP-123",
        provider: "AIRTEL_ZMB",
      }));
    });

    it("uses an explicit provider without predicting", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        status: "SUBMITTED",
        depositId: "11111111-1111-4111-8111-111111111111",
      }));

      const result = await makeApi().initiateDeposit({
        phoneNumber: "+233241234567",
        amount: 25,
        currency: "GHS",
        reference: "ORDER-456",
        description: "Invoice payment",
        provider: "MTN_MOMO_GHA",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toBe("https://api.sandbox.pawapay.io/v2/deposits");
      expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual(expect.objectContaining({
        correspondent: "MTN_MOMO_GHA",
        currency: "GHS",
      }));
      expect(result).toEqual(expect.objectContaining({
        status: "PENDING",
        provider: "MTN_MOMO_GHA",
      }));
    });

    it("fails when provider cannot be determined", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      const result = await makeApi().initiateDeposit({
        phoneNumber: "+260971234567",
        amount: 10,
        currency: "ZMW",
        reference: "ORDER-789",
        description: "Missing provider test",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({
        status: "FAILED",
        message: "Unable to determine PawaPay provider for phone number",
      }));
    });
  });

  describe("getDepositStatus", () => {
    it("normalizes successful deposit status lookups", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        status: "COMPLETED",
        depositId: "dep-001",
        amount: "12.5",
        currency: "ZMW",
        correspondent: "AIRTEL_ZMB",
        providerReference: "PWP-STATUS-1",
        createdAt: "2026-05-08T08:00:00Z",
      }));

      const result = await makeApi().getDepositStatus("dep-001");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.sandbox.pawapay.io/v2/deposits/dep-001",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-pawapay-token",
            Accept: "application/json",
          }),
        })
      );
      expect(result).toEqual(expect.objectContaining({
        success: true,
        status: "SUCCESS",
        transactionId: "dep-001",
        amount: 12.5,
        currency: "ZMW",
        provider: "AIRTEL_ZMB",
        providerReference: "PWP-STATUS-1",
      }));
    });

    it("maps rejected provider status to cancelled", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        status: "REJECTED",
        depositId: "dep-002",
      }));

      await expect(makeApi().getDepositStatus("dep-002")).resolves.toEqual(expect.objectContaining({
        success: false,
        status: "CANCELLED",
        transactionId: "dep-002",
      }));
    });
  });
});

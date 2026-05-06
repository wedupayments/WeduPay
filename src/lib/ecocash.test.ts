import { EcoCashAPI } from "@/lib/ecocash";
import { EcoCashAPI as AdapterEcoCashAPI } from "@/services/wallets/ecocash.adapter";

const mockFetch = jest.fn();

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const status = init.status || 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

function makeApi(overrides: Partial<ConstructorParameters<typeof EcoCashAPI>[0]> = {}) {
  return new EcoCashAPI({
    apiKey: "test-api-key",
    merchantCode: "merchant-001",
    appId: "app-001",
    appName: "WeduPay Test",
    baseUrl: "https://developers.ecocash.co.zw",
    mode: "sandbox",
    ...overrides,
  });
}

describe("EcoCashAPI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  describe("phone numbers", () => {
    it.each([
      ["0771234567", "263771234567"],
      ["771234567", "263771234567"],
      ["+263 77 123 4567", "263771234567"],
      ["00263 77 123 4567", "263771234567"],
    ])("formats %s as %s", (input, expected) => {
      expect(makeApi().formatPhoneNumber(input)).toBe(expected);
    });

    it.each(["0771234567", "0711234567", "0781234567", "+263 77 123 4567"])(
      "accepts valid Zimbabwe EcoCash number %s",
      (phone) => {
        expect(makeApi().validatePhoneNumber(phone)).toBe(true);
      }
    );

    it.each(["0721234567", "0731234567", "263991234567", "12345", ""])(
      "rejects invalid EcoCash number %s",
      (phone) => {
        expect(makeApi().validatePhoneNumber(phone)).toBe(false);
      }
    );
  });

  describe("initPayment", () => {
    it("posts an EcoCash payment request with merchant and app fields", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        status: "PENDING_VALIDATION",
        sourceReference: "SRC-001",
        message: "Prompt sent",
      }));

      const result = await makeApi().initPayment(
        "0771234567",
        12.5,
        "Wallet funding",
        "EC-REF-001",
        "USD"
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://developers.ecocash.co.zw/api/ecocash_pay",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "X-API-Key": "test-api-key",
            "X-App-Id": "app-001",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            mobileNumber: "263771234567",
            amount: 12.5,
            reason: "Wallet funding",
            currency: "USD",
            reference: "EC-REF-001",
            merchantCode: "merchant-001",
            appId: "app-001",
            appName: "WeduPay Test",
          }),
        })
      );
      expect(result).toEqual(expect.objectContaining({
        status: "PENDING_VALIDATION",
        sourceReference: "SRC-001",
        message: "Prompt sent",
      }));
    });

    it("normalizes successful provider statuses", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        status: "PAID",
        ecocashReference: "ECO-123",
      }));

      await expect(
        makeApi().initPayment("0771234567", 5, "Top up", "EC-REF-002")
      ).resolves.toEqual(expect.objectContaining({
        status: "SUCCESS",
        sourceReference: "ECO-123",
        ecocashReference: "ECO-123",
      }));
    });

    it("returns a failed response when credentials are missing", async () => {
      const result = await makeApi({ apiKey: "" }).initPayment(
        "0771234567",
        5,
        "Top up",
        "EC-REF-003"
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        status: "FAILED",
        message: "EcoCash API key is not configured",
      }));
    });

    it("surfaces provider error messages", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { message: "Invalid merchant" },
        { status: 400 }
      ));

      await expect(
        makeApi().initPayment("0771234567", 5, "Top up", "EC-REF-004")
      ).resolves.toEqual(expect.objectContaining({
        status: "FAILED",
        message: "Invalid merchant",
      }));
    });
  });

  describe("lookupTransaction", () => {
    it("looks up transaction status with reference and phone", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        status: "SUCCESS",
        amount: { amount: 10, currency: "USD" },
        customerMsisdn: "263771234567",
        ecocashReference: "ECO-LOOKUP-1",
        transactionDateTime: "2026-05-06T10:00:00Z",
      }));

      const result = await makeApi().lookupTransaction("0771234567", "EC-REF-005");

      const calledUrl = String(mockFetch.mock.calls[0][0]);
      expect(calledUrl).toContain("/api/lookup_transaction");
      expect(calledUrl).toContain("mobileNumber=263771234567");
      expect(calledUrl).toContain("reference=EC-REF-005");
      expect(result).toEqual(expect.objectContaining({
        paymentSuccess: true,
        status: "SUCCESS",
        ecocashReference: "ECO-LOOKUP-1",
        amount: { amount: 10, currency: "USD" },
      }));
    });

    it("falls back to POST lookup when GET is not allowed", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ message: "Method not allowed" }, { status: 405 }))
        .mockResolvedValueOnce(jsonResponse({
          status: "PENDING",
          reference: "EC-REF-006",
        }));

      const result = await makeApi().lookupTransaction("0771234567", "EC-REF-006");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0]).toBe("https://developers.ecocash.co.zw/api/lookup_transaction");
      expect(mockFetch.mock.calls[1][1]).toEqual(expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          mobileNumber: "263771234567",
          reference: "EC-REF-006",
        }),
      }));
      expect(result).toEqual(expect.objectContaining({
        paymentSuccess: false,
        status: "PENDING",
        reference: "EC-REF-006",
      }));
    });
  });

  describe("refundPayment", () => {
    it("posts EcoCash refund details using the portal field names", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        status: "SUCCESS",
        ecocashReference: "REFUND-001",
      }));

      const result = await makeApi().refundPayment({
        originalEcocashTransactionReference: "ECO-ORIGINAL-001",
        refundCorrelator: "REF-COR-001",
        sourceMobileNumber: "0771234567",
        amount: 4.75,
        clientName: "Test Customer",
        currency: "USD",
        reasonForRefund: "Customer refund",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://developers.ecocash.co.zw/api/refund",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            originalEcocashTransactionReference: "ECO-ORIGINAL-001",
            refundCorrelator: "REF-COR-001",
            sourceMobileNumber: "263771234567",
            amount: 4.75,
            clientName: "Test Customer",
            currency: "USD",
            reasonForRefund: "Customer refund",
            merchantCode: "merchant-001",
            appId: "app-001",
            appName: "WeduPay Test",
          }),
        })
      );
      expect(result).toEqual(expect.objectContaining({
        status: "SUCCESS",
        ecocashReference: "REFUND-001",
      }));
    });
  });
});

describe("EcoCash wallet adapter", () => {
  it("re-exports the canonical EcoCash client", () => {
    expect(AdapterEcoCashAPI).toBe(EcoCashAPI);
  });
});

import { MpesaAPI } from "@/lib/mpesa";
import { MpesaAPI as AdapterMpesaAPI } from "@/services/wallets/mpesa.adapter";

const mockFetch = jest.fn();

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const status = init.status || 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function makeApi(overrides: Partial<ConstructorParameters<typeof MpesaAPI>[0]> = {}) {
  return new MpesaAPI({
    consumerKey: "consumer-key",
    consumerSecret: "consumer-secret",
    shortCode: "174379",
    passkey: "passkey-123",
    environment: "sandbox",
    baseUrl: "https://sandbox.safaricom.co.ke",
    callbackBaseUrl: "https://wedupay.example",
    ...overrides,
  });
}

describe("MpesaAPI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  describe("phone numbers", () => {
    it.each([
      ["0712345678", "254712345678"],
      ["712345678", "254712345678"],
      ["+254 712 345 678", "254712345678"],
      ["0112345678", "254112345678"],
    ])("formats %s as %s", (input, expected) => {
      expect(makeApi().formatPhoneNumber(input)).toBe(expected);
    });

    it.each(["0712345678", "0112345678", "254712345678", "+254112345678"])(
      "accepts valid Kenya M-Pesa number %s",
      (phone) => {
        expect(makeApi().validatePhoneNumber(phone)).toBe(true);
      }
    );

    it.each(["07234567", "254212345678", "263771234567", "12345", ""])(
      "rejects invalid M-Pesa number %s",
      (phone) => {
        expect(makeApi().validatePhoneNumber(phone)).toBe(false);
      }
    );
  });

  describe("getAccessToken", () => {
    it("requests a Safaricom OAuth token with basic auth", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ access_token: "token-123", expires_in: 3600 })
      );

      const token = await makeApi().getAccessToken();

      expect(token).toBe("token-123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /),
          }),
        })
      );
    });

    it("throws when consumer credentials are missing", async () => {
      await expect(
        makeApi({ consumerKey: "", consumerSecret: "" }).getAccessToken()
      ).rejects.toThrow("M-Pesa consumer credentials are not configured");
    });
  });

  describe("initiateSTKPush", () => {
    it("posts an STK push request with callback URL and normalized provider fields", async () => {
      mockFetch
        .mockResolvedValueOnce(
          jsonResponse({ access_token: "token-123", expires_in: 3600 })
        )
        .mockResolvedValueOnce(
          jsonResponse({
            CheckoutRequestID: "ws_CO_123",
            MerchantRequestID: "merchant-123",
            ResponseCode: "0",
            ResponseDescription: "Accepted",
            CustomerMessage: "Success. Request accepted for processing",
          })
        );

      const result = await makeApi().initiateSTKPush({
        phoneNumber: "0712345678",
        amount: 1250,
        reference: "MP-REF-001",
        description: "Wallet funding",
        callbackUrl: "https://wedupay.example/api/v1/webhooks/mpesa",
      });

      expect(mockFetch).toHaveBeenLastCalledWith(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer token-123",
            "Content-Type": "application/json",
          }),
          body: expect.any(String),
        })
      );

      const payload = JSON.parse(mockFetch.mock.calls[1][1].body as string);
      expect(payload).toEqual(
        expect.objectContaining({
          BusinessShortCode: "174379",
          TransactionType: "CustomerPayBillOnline",
          Amount: 1250,
          PartyA: "254712345678",
          PartyB: "174379",
          PhoneNumber: "254712345678",
          CallBackURL: "https://wedupay.example/api/v1/webhooks/mpesa",
          AccountReference: "MP-REF-001",
          TransactionDesc: "Wallet funding",
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          responseCode: "0",
          checkoutRequestId: "ws_CO_123",
          merchantRequestId: "merchant-123",
        })
      );
    });

    it("returns a failed response when Safaricom returns an error payload", async () => {
      mockFetch
        .mockResolvedValueOnce(
          jsonResponse({ access_token: "token-123", expires_in: 3600 })
        )
        .mockResolvedValueOnce(
          jsonResponse(
            { errorCode: "400.002.02", errorMessage: "Invalid Access Token" },
            { status: 400 }
          )
        );

      await expect(
        makeApi().initiateSTKPush({
          phoneNumber: "0712345678",
          amount: 100,
          reference: "MP-REF-002",
          description: "Wallet funding",
          callbackUrl: "https://wedupay.example/api/v1/webhooks/mpesa",
        })
      ).resolves.toEqual(
        expect.objectContaining({
          responseCode: "400.002.02",
          responseDescription: "Invalid Access Token",
        })
      );
    });
  });

  describe("querySTKStatus", () => {
    it("queries transaction status and normalizes receipt details", async () => {
      mockFetch
        .mockResolvedValueOnce(
          jsonResponse({ access_token: "token-123", expires_in: 3600 })
        )
        .mockResolvedValueOnce(
          jsonResponse({
            ResponseCode: "0",
            ResponseDescription: "The service request is processed successfully.",
            ConversationID: "AG_20260506_123",
            OriginatorConversationID: "12345",
            MpesaReceiptNumber: "QWE123XYZ",
            TransactionDate: "20260506120000",
            Amount: 500,
          })
        );

      const result = await makeApi().querySTKStatus("ws_CO_123");

      expect(mockFetch).toHaveBeenLastCalledWith(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/queryrequest",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer token-123",
          }),
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          responseCode: "0",
          transactionReceipt: "QWE123XYZ",
          transactionDate: "20260506120000",
          transactionAmount: 500,
        })
      );
    });
  });

  describe("parseCallbackPayload", () => {
    it("extracts callback metadata from the Safaricom callback shape", () => {
      const parsed = makeApi().parseCallbackPayload({
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
                { Name: "PhoneNumber", Value: 254712345678 },
                { Name: "TransactionDate", Value: 20260506120000 },
              ],
            },
          },
        },
      });

      expect(parsed).toEqual({
        resultCode: "0",
        resultDesc: "The service request is processed successfully.",
        merchantRequestId: "merchant-123",
        checkoutRequestId: "ws_CO_123",
        amount: 500,
        accountReference: undefined,
        phoneNumber: "254712345678",
        transactionId: "QWE123XYZ",
        transactionDate: "20260506120000",
      });
    });
  });

  describe("callback URLs", () => {
    it("builds the app webhook callback URL", () => {
      expect(makeApi().getCallbackUrl()).toBe(
        "https://wedupay.example/api/v1/webhooks/mpesa"
      );
    });
  });
});

describe("M-Pesa wallet adapter", () => {
  it("re-exports the canonical M-Pesa client", () => {
    expect(AdapterMpesaAPI).toBe(MpesaAPI);
  });
});

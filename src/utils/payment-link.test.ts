import fc from 'fast-check';
import { PaymentLinkParser, PaymentLinkFormatter } from './payment-link';

describe('PaymentLink Utilities Property-based Tests', () => {
  // Property 37: Payment Link Parser Validation - Validates: Requirements 7.1
  it('should parse valid payment link data correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          amount: fc.double({ min: 0.01, max: 1000000 }).filter(n => !isNaN(n)),
          currency: fc.string({ minLength: 3, maxLength: 3 }).filter(s => /^[a-zA-Z]{3}$/.test(s)),
          description: fc.option(fc.string()),
        }),
        (data) => {
          const result = PaymentLinkParser.parse(data);
          expect(result.amount).toBe(Number(data.amount));
          expect(result.currency).toBe(data.currency.toUpperCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 38: Parser Error Handling - Validates: Requirements 7.2
  it('should throw error for invalid amount or currency', () => {
    expect(() => PaymentLinkParser.parse({ amount: -1, currency: 'USD' })).toThrow();
    expect(() => PaymentLinkParser.parse({ amount: 100, currency: 'US' })).toThrow();
  });

  // Property 39: Payment Link Formatter Output - Validates: Requirements 7.3
  it('should format sharable URLs correctly', () => {
    const url = PaymentLinkFormatter.formatUrl('abc-123', 'https://wedupay.com');
    expect(url).toBe('https://wedupay.com/pay/abc-123');
  });

  // Property 40: Payment Link Round-Trip Property - Validates: Requirements 7.4
  it('should round-trip metadata encoding/decoding', () => {
    fc.assert(
      fc.property(
        fc.object(),
        (metadata) => {
          const encoded = PaymentLinkFormatter.encodeMetadata(metadata);
          const decoded = PaymentLinkFormatter.decodeMetadata(encoded);
          expect(decoded).toEqual(JSON.parse(JSON.stringify(metadata)));
        }
      ),
      { numRuns: 100 }
    );
  });
});

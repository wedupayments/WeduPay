import { determineUserRole, resolveExistingUserRole } from "./route";

describe("User Role Determination", () => {
  const originalDemoAdminEmail = process.env.DEMO_ADMIN_EMAIL;
  const originalDemoMerchantEmail = process.env.DEMO_MERCHANT_EMAIL;

  beforeEach(() => {
    process.env.DEMO_ADMIN_EMAIL = "admin@example.com";
    process.env.DEMO_MERCHANT_EMAIL = "merchant@example.com";
  });

  afterAll(() => {
    process.env.DEMO_ADMIN_EMAIL = originalDemoAdminEmail;
    process.env.DEMO_MERCHANT_EMAIL = originalDemoMerchantEmail;
  });

  describe("determineUserRole", () => {
    it("should return ADMIN for the configured demo admin regardless of requested role", () => {
      expect(determineUserRole("admin@example.com")).toBe("ADMIN");
      expect(determineUserRole("admin@example.com", "USER")).toBe("ADMIN");
      expect(determineUserRole("admin@example.com", "MERCHANT")).toBe("ADMIN");
    });

    it("should return MERCHANT for the configured demo merchant regardless of requested role", () => {
      expect(determineUserRole("merchant@example.com")).toBe("MERCHANT");
      expect(determineUserRole("merchant@example.com", "USER")).toBe("MERCHANT");
    });

    it("should return the requested role if valid for a normal email", () => {
      expect(determineUserRole("normal@example.com", "MERCHANT")).toBe("MERCHANT");
      expect(determineUserRole("normal@example.com", "ADMIN")).toBe("ADMIN");
    });

    it("should default to USER for normal email when no role is requested", () => {
      expect(determineUserRole("normal@example.com")).toBe("USER");
    });

    it("should default to USER if an invalid role is somehow passed", () => {
       // Since the API schema checks enum, this is just for safety
       // TypeScript complains if we pass a string not in the 'USER' | 'MERCHANT' | 'ADMIN' union,
       // so we cast to any.
       expect(determineUserRole("normal@example.com", "SUPERADMIN" as any)).toBe("USER");
    });
  });

  describe("resolveExistingUserRole", () => {
    it("should retain existing ADMIN role", () => {
      expect(resolveExistingUserRole("normal@example.com", "ADMIN", "USER")).toBe("ADMIN");
    });

    it("should retain existing MERCHANT role", () => {
      expect(resolveExistingUserRole("normal@example.com", "MERCHANT", "USER")).toBe("MERCHANT");
    });

    it("should allow upgrading from USER to MERCHANT if requested", () => {
      expect(resolveExistingUserRole("normal@example.com", "USER", "MERCHANT")).toBe("MERCHANT");
    });

    it("should correctly handle configured demo accounts", () => {
      expect(resolveExistingUserRole("merchant@example.com", "USER")).toBe("MERCHANT");
      expect(resolveExistingUserRole("admin@example.com", "USER")).toBe("ADMIN");
    });
  });
});

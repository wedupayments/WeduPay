import { determineUserRole, resolveExistingUserRole } from "./route";

describe("User Role Determination", () => {
  describe("determineUserRole", () => {
    it("should return ADMIN for admin@wedupay.test regardless of requested role", () => {
      expect(determineUserRole("admin@wedupay.test")).toBe("ADMIN");
      expect(determineUserRole("admin@wedupay.test", "USER")).toBe("ADMIN");
      expect(determineUserRole("admin@wedupay.test", "MERCHANT")).toBe("ADMIN");
    });

    it("should return MERCHANT for merchant@wedupay.test regardless of requested role", () => {
      expect(determineUserRole("merchant@wedupay.test")).toBe("MERCHANT");
      expect(determineUserRole("merchant@wedupay.test", "USER")).toBe("MERCHANT");
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

    it("should correctly handle dummy accounts", () => {
      expect(resolveExistingUserRole("merchant@wedupay.test", "USER")).toBe("MERCHANT");
      expect(resolveExistingUserRole("admin@wedupay.test", "USER")).toBe("ADMIN");
    });
  });
});

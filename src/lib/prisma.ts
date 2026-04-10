import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Use direct connection in development to avoid pool exhaustion
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return process.env.DIRECT_URL || process.env.DATABASE_URL;
  }
  return process.env.DATABASE_URL;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown - only on Node.js
if (typeof process !== "undefined" && process.on && process.env.NODE_ENV !== "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

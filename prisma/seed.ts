import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding test accounts...");

  // Delete existing test accounts first (in correct order for foreign keys)
  await prisma.ledgerEntry.deleteMany({});
  await prisma.paymentReference.deleteMany({
    where: {
      referenceCode: { in: ["BYU-2024-88291", "MAT-BK-2024"] }
    }
  });
  await prisma.transaction.deleteMany({
    where: {
      reference: { in: ["BYU-Pathway Tuition", "Application Fee", "Course Materials", "Library Fees", "Student Payment - Lagos", "Student Payment - Abuja"] }
    }
  });
  await prisma.wallet.deleteMany({
    where: {
      walletType: { in: ["EcoCash", "M-Pesa", "MTN Mobile", "Admin"] }
    }
  });
  await prisma.user.deleteMany({
    where: {
      email: { in: ["customer@wedupay.test", "merchant@wedupay.test", "admin@wedupay.test"] }
    }
  });

  // Demo Customer Account
  const customer = await prisma.user.create({
    data: {
      email: "customer@wedupay.test",
      phoneNumber: "+263771234567",
      country: "Zimbabwe",
      kycStatus: "VERIFIED",
      role: "USER",
      supabaseUserId: null,
      wallets: {
        create: [
          {
            walletType: "EcoCash",
            currency: "USD",
            balance: 1240.0,
          },
          {
            walletType: "M-Pesa",
            currency: "USD",
            balance: 560.0,
          },
        ],
      },
      transactions: {
        create: [
          {
            amount: 450.0,
            currency: "USD",
            status: "COMPLETED",
            type: "TUITION",
            reference: "BYU-Pathway Tuition",
          },
          {
            amount: 35.0,
            currency: "USD",
            status: "PENDING",
            type: "FEE",
            reference: "Application Fee",
          },
          {
            amount: 150.0,
            currency: "USD",
            status: "COMPLETED",
            type: "BOOKS",
            reference: "Course Materials",
          },
          {
            amount: 75.0,
            currency: "USD",
            status: "COMPLETED",
            type: "FEE",
            reference: "Library Fees",
          },
        ],
      },
      references: {
        create: [
          {
            title: "BYU-Pathway Worldwide",
            institution: "BYU-Pathway",
            referenceCode: "BYU-2024-88291",
            isActive: true,
          },
          {
            title: "Course Materials Fund",
            institution: "Bookstore",
            referenceCode: "MAT-BK-2024",
            isActive: true,
          },
        ],
      },
    },
  });

  // Merchant Account
  await prisma.user.create({
    data: {
      email: "merchant@wedupay.test",
      phoneNumber: "+2348012345678",
      country: "Nigeria",
      kycStatus: "VERIFIED",
      role: "MERCHANT",
      supabaseUserId: null,
      wallets: {
        create: [
          {
            walletType: "M-Pesa",
            currency: "USD",
            balance: 2180.0,
          },
          {
            walletType: "MTN Mobile",
            currency: "USD",
            balance: 1890.0,
          },
        ],
      },
      transactions: {
        create: [
          {
            amount: 1200.0,
            currency: "USD",
            status: "COMPLETED",
            type: "PAYMENT_RECEIVED",
            reference: "Student Payment - Lagos",
          },
          {
            amount: 850.0,
            currency: "USD",
            status: "COMPLETED",
            type: "PAYMENT_RECEIVED",
            reference: "Student Payment - Abuja",
          },
        ],
      },
    },
  });

  // Admin Account
  await prisma.user.create({
    data: {
      email: "admin@wedupay.test",
      phoneNumber: "+263772000000",
      country: "Zimbabwe",
      kycStatus: "VERIFIED",
      role: "ADMIN",
      supabaseUserId: null,
      wallets: {
        create: {
          walletType: "Admin",
          currency: "USD",
          balance: 0.0,
        },
      },
    },
  });

  console.log("✅ Test accounts created:");
  console.log(`   👤 Customer: ${customer.email}`);
  console.log(`   🏪 Merchant: merchant@wedupay.test`);
  console.log(`   👑 Admin: admin@wedupay.test`);
  console.log("\n🔐 Default password for all accounts: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

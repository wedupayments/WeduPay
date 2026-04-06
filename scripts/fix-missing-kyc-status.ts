import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Set a default KYC status for users with missing or empty kycStatus
  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { kycStatus: { equals: '' } },
        { kycStatus: { equals: null } },
      ],
    },
    data: {
      kycStatus: 'PENDING', // or 'VERIFIED', adjust as needed
    },
  });
  console.log(`Updated ${result.count} users with missing/empty/null kycStatus.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

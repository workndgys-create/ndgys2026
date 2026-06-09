import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.track.findFirst({ select: { id: true } });
  console.log("✅ Connected");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
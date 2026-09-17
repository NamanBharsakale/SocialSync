import "dotenv/config";
import { prisma } from "./config/prisma.js";
async function test() {
  try {
    await prisma.$connect();

    const result = await prisma.$queryRaw<
      { version: string }[]
    >`SELECT version()`;

    console.log("PostgreSQL connection successful!");
    console.log(result[0].version);
  } catch (error) {
    console.error("PostgreSQL connection failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

test();
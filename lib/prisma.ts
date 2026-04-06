import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return createMissingDatabaseProxy();
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function createMissingDatabaseProxy(): PrismaClient {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          "DATABASE_URL is not configured. Guest browsing can work without it, but auth and saved wardrobe features require a Postgres database.",
        );
      },
    },
  ) as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

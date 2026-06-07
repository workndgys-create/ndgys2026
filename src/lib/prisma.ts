import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

export const prisma: any = (() => {
  if (!process.env.DATABASE_URL) {
    const handler: ProxyHandler<any> = {
      get() {
        return new Proxy(() => Promise.resolve([]), {
          apply: () => Promise.resolve([]),
          get: () => () => Promise.resolve([]),
        });
      },
    };
    return new Proxy({}, handler);
  }

  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
})();

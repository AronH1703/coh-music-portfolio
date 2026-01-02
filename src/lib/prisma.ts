import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const isProd = process.env.NODE_ENV === "production";

const prismaClientSingleton = () => {
  if (isProd) {
    // Production: Turso (libSQL)
    const adapter = new PrismaLibSQL({
      url: process.env.DATABASE_URL!,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  }

  // Local dev: file-based SQLite
  return new PrismaClient({
    log: ["error", "warn"],
  });
};

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? prismaClientSingleton();

if (!isProd) {
  global.prisma = prisma;
}

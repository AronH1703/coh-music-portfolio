import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const isProd = process.env.NODE_ENV === "production";

const prismaClientSingleton = () => {
  if (isProd) {
    // Production: Turso (libSQL)
    const libsql = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSQL(libsql);

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
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? prismaClientSingleton();

if (!isProd) {
  global.prisma = prisma;
}

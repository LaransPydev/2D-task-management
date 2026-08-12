import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const g = globalThis as unknown as { __prisma?: PrismaClient | null };

function make(): PrismaClient | null {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    console.warn("Database env vars (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) are not set — database features disabled.");
    return null;
  }
  try {
    const pool = new pg.Pool({
      host: DB_HOST,
      port: Number(DB_PORT ?? 5432),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      ssl: { rejectUnauthorized: false },
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (e) {
    console.warn("Could not connect to PostgreSQL:", e);
    return null;
  }
}

export const prisma = g.__prisma ?? make();
if (process.env.NODE_ENV !== "production") g.__prisma = prisma ?? undefined;

export function requirePrisma(): NonNullable<typeof prisma> {
  if (!prisma) throw new Error("No database connected. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env.");
  return prisma;
}

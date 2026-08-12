import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

// Standard "singleton across hot reloads" pattern -- Next.js dev mode reloads
// modules on every change, and without this you leak a new connection pool
// per reload until the DB refuses more connects.
const g = globalThis as unknown as { __prisma?: PrismaClient | null };

function make(): PrismaClient | null {
  try {
    const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    return new PrismaClient({ adapter });
  } catch (e) {
    console.warn("Could not open SQLite database:", e);
    return null;
  }
}

export const prisma = g.__prisma ?? make();
if (process.env.NODE_ENV !== "production") g.__prisma = prisma ?? undefined;

export function requirePrisma(): NonNullable<typeof prisma> {
  if (!prisma) throw new Error("No database connected. Set DATABASE_URL in .env to enable this feature.");
  return prisma;
}

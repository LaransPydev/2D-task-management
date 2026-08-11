import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Standard "singleton across hot reloads" pattern -- Next.js dev mode reloads
// modules on every change, and without this you leak a new connection pool
// per reload until the DB refuses more clients.
const g = globalThis as unknown as { __prisma?: PrismaClient };

function make() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env (local dev) or " +
        "set it in Vercel's project environment variables (production).",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = g.__prisma ?? make();
if (process.env.NODE_ENV !== "production") g.__prisma = prisma;

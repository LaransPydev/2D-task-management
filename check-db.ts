import "dotenv/config";
import { PrismaClient } from "./app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) throw new Error("Database environment variables are required.");
const password = DB_PASSWORD.replace(/\\\$/g, () => "$");
const pool = new pg.Pool({
  host: DB_HOST,
  port: Number(DB_PORT ?? 5432),
  user: DB_USER,
  password,
  database: DB_NAME,
  ssl: { rejectUnauthorized: false },
});
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const members = await db.member.findMany({
    orderBy: { createdAt: "asc" },
    select: { name: true, username: true, email: true, role: true, passwordHash: true },
  });
  console.log("\n=== USERS ===");
  console.table(members.map(({ passwordHash, ...member }) => ({ ...member, hasPassword: Boolean(passwordHash) })));

  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, product: true, stage: true, designer: true, createdAt: true },
  });
  console.log("\n=== PROJECTS ===");
  console.table(projects);

  const events = await db.event.findMany({
    orderBy: { at: "desc" },
    take: 10,
    select: { projectId: true, actor: true, kind: true, at: true },
  });
  console.log("\n=== RECENT EVENTS ===");
  console.table(events);

  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});

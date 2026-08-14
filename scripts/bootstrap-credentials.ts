import "dotenv/config";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const scrypt = promisify(scryptCallback);
const outputPath = path.join(process.cwd(), ".credentials.local.csv");
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error("Database environment variables are required.");
}

const pool = new pg.Pool({
  host: DB_HOST,
  port: Number(DB_PORT ?? 5432),
  user: DB_USER,
  password: DB_PASSWORD.replace(/\\\$/g, () => "$"),
  database: DB_NAME,
  ssl: { rejectUnauthorized: false },
});
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

function csv(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

async function main() {
  const users = await db.member.findMany({
    where: { passwordHash: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, username: true, role: true },
  });

  if (users.length === 0) {
    console.log("Every user already has a password. No credentials were changed.");
    return;
  }

  const credentials = users.map((user) => ({
    ...user,
    password: randomBytes(18).toString("base64url"),
  }));
  const updates = await Promise.all(credentials.map(async (item) => ({
    id: item.id,
    passwordHash: await hashPassword(item.password),
  })));
  const rows = [
    "name,username,role,temporary_password",
    ...credentials.map((item) => [item.name, item.username, item.role, item.password].map(csv).join(",")),
  ];

  await writeFile(outputPath, `${rows.join("\n")}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
  try {
    await db.$transaction(
      updates.map((item) => db.member.update({
        where: { id: item.id },
        data: { passwordHash: item.passwordHash, passwordUpdatedAt: new Date() },
      })),
    );
  } catch (error) {
    await unlink(outputPath).catch(() => undefined);
    throw error;
  }

  console.log(`Initialized ${credentials.length} users. Credentials: ${outputPath}`);
}

main()
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
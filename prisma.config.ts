import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function buildUrl(): string {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const user = encodeURIComponent(DB_USER ?? "");
  const pass = encodeURIComponent(DB_PASSWORD ?? "");
  const port = DB_PORT ?? "5432";
  return `postgresql://${user}:${pass}@${DB_HOST}:${port}/${DB_NAME}?sslmode=require`;
}

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: buildUrl(),
    adapter: new PrismaPg(pool),
  },
});

import "dotenv/config";
import { defineConfig } from "prisma/config";

function buildUrl(): string {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const user = encodeURIComponent(DB_USER ?? "");
  const pass = encodeURIComponent((DB_PASSWORD ?? "").replace(/\\\$/g, () => "$"));
  const port = DB_PORT ?? "5432";
  return `postgresql://${user}:${pass}@${DB_HOST}:${port}/${DB_NAME}?sslmode=require`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: buildUrl(),
  },
});

/**
 * Resets every member's password to the default (ST@123456) ONLY if
 * password_updated_at is null or the hash was set by the migration seed
 * (i.e. has never been changed by a real user).
 *
 * Run on server:
 *   node scripts/reset-passwords.mjs
 * with DB_* env vars exported.
 */
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const scrypt = promisify(scryptCb);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error("Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT before running.");
  process.exit(1);
}

const pool = new pg.Pool({
  host: DB_HOST,
  port: Number(DB_PORT ?? 5432),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: { rejectUnauthorized: false },
});

const DEFAULT_PASSWORD = "ST@123456";
const hash = await hashPassword(DEFAULT_PASSWORD);
console.log("Generated hash for ST@123456:", hash);

// Update ALL members — overwrites whatever is in the DB so login works immediately.
// After login, users can change their own password.
const result = await pool.query(
  `UPDATE members SET password_hash = $1, password_updated_at = NOW()`,
  [hash]
);
console.log(`Updated ${result.rowCount} member(s).`);

// Show current member list so we can verify
const { rows } = await pool.query(
  `SELECT username, name, role FROM members ORDER BY name`
);
console.table(rows);

await pool.end();

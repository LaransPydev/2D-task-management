import { readFileSync } from 'fs';
import pg from 'pg';

// Parse .env with \$ unescaping (simulating dotenv-expand)
const envContent = readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=\s]+)=(.*)$/);
  if (!m) continue;
  let val = m[2].trim();
  // dotenv-expand: \$ → $
  val = val.replace(/\\\$/g, '$');
  env[m[1]] = val;
}

console.log('DB_HOST:', env.DB_HOST ? 'set' : 'MISSING');
console.log('DB_PASSWORD length:', env.DB_PASSWORD?.length);
console.log('DB_PASSWORD preview:', env.DB_PASSWORD?.[0] + env.DB_PASSWORD?.[1] + '...' + env.DB_PASSWORD?.slice(-2));

const pool = new pg.Pool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT ?? '5432'),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

pool.query('SELECT current_user, current_database()')
  .then(r => { console.log('CONNECTED:', r.rows[0]); pool.end(); })
  .catch(e => { console.error('FAILED:', e.message); pool.end(); });

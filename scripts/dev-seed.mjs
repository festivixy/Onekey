// Emits SQL that seeds a LOCAL-ONLY admin account for `wrangler pages dev`.
// Password hashing mirrors functions/api/lib/password.ts (PBKDF2-SHA256, 100k iters).
// Usage: node scripts/dev-seed.mjs <out.sql>
import { writeFileSync } from 'node:fs';

const OWNER_EMAIL = 'iscurt.w@gmail.com'; // matches functions/api/lib/roles.ts
const DEV_USERNAME = 'admin';
const DEV_PASSWORD = 'admin123';
const ITERATIONS = 100_000;

const toHex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return `${toHex(salt)}:${toHex(bits)}`;
}

const out = process.argv[2];
if (!out) { console.error('usage: node scripts/dev-seed.mjs <out.sql>'); process.exit(1); }

const hash = await hashPassword(DEV_PASSWORD);
const now = new Date().toISOString();
const sql = `INSERT OR IGNORE INTO users (id, username, email, password_hash, first_name, last_name, role, is_active, created_at)
VALUES ('dev-owner', '${DEV_USERNAME}', '${OWNER_EMAIL}', '${hash}', 'Dev', 'Owner', 'super_admin', 1, '${now}');
`;
writeFileSync(out, sql);
console.log(`Dev admin seed written (login: ${DEV_USERNAME} / ${DEV_PASSWORD})`);

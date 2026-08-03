import { env, applyD1Migrations } from 'cloudflare:test'
// vitest-pool-workers exposes migrations declared in vitest.config.ts.
// This helper is imported by test setup to guarantee the schema exists.
export async function ensureSchema(): Promise<void> {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
}

import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config'
import path from 'node:path'

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(path.join(__dirname, 'test/migrations'))
  return {
    test: {
      include: ['functions/**/*.test.ts'],
      poolOptions: {
        workers: {
          singleWorker: true,
          miniflare: {
            compatibilityDate: '2024-09-23',
            compatibilityFlags: ['nodejs_compat'],
            d1Databases: { DB: 'test-db' },
            r2Buckets: ['BUCKET'],
            bindings: { TEST_MIGRATIONS: migrations, JWT_SECRET: 'test-secret' },
          },
        },
      },
    },
  }
})

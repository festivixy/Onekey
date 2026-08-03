import { Hono } from 'hono'
import { authRoutes } from './routes/auth'
import { teamRoutes } from './routes/team'
import { eventRoutes } from './routes/events'
import { photoRoutes } from './routes/photos'
import { vanstringRoutes } from './routes/vanstring'
import { userRoutes } from './routes/users'
import { logRoutes } from './routes/logs'
import { fileRoutes } from './routes/files'
import { uploadRoutes } from './routes/uploads'

export type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.onError((err, c) => {
  console.error(err)
  return c.json({ success: false, error: 'Internal server error' }, 500)
})

app.get('/health', (c) => c.json({ success: true, data: { status: 'ok' } }))

app.route('/', authRoutes)
app.route('/', teamRoutes)
app.route('/', eventRoutes)
app.route('/', photoRoutes)
app.route('/', vanstringRoutes)
app.route('/', userRoutes)
app.route('/', logRoutes)
app.route('/', fileRoutes)
app.route('/', uploadRoutes)

export default app

export type UserRow = {
  id: string; username: string; email: string; password_hash: string
  first_name: string | null; last_name: string | null; role: string
  is_active: number; created_at: string; last_login_at: string | null
}

export function serializeUser(row: UserRow) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    role: row.role,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? undefined,
  }
}

// ── Events ──
export type EventRow = {
  id: string; name: string; date: string; category: string
  location: string | null; time: string | null; attendees: string | null
  performers: string | null; duration: string | null; description: string | null
  photo_url: string | null; created_at: string; updated_at: string
}
export function serializeEvent(row: EventRow) {
  return {
    id: row.id, name: row.name, date: row.date, category: row.category,
    location: row.location ?? undefined, time: row.time ?? undefined,
    attendees: row.attendees ?? undefined, performers: row.performers ?? undefined,
    duration: row.duration ?? undefined, description: row.description ?? undefined,
    photo_url: row.photo_url ?? undefined, created_at: row.created_at, updated_at: row.updated_at,
  }
}
const EVENT_FIELDS = ['name','date','category','location','time','attendees','performers','duration','description','photo_url'] as const
export function eventInputToColumns(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of EVENT_FIELDS) if (k in input && input[k] !== undefined) out[k] = input[k]
  return out
}

// ── Team members ──
export type TeamRow = {
  id: string; name: string; role: string | null; school: string | null; bio: string | null
  instagram: string | null; image: string | null; sections: string
  group_name: string | null; concertmaster_type: string | null
  is_active: number; created_at: string; updated_at: string
}
export function serializeTeamMember(row: TeamRow) {
  let sections: string[] = []
  try { const p = JSON.parse(row.sections); if (Array.isArray(p)) sections = p } catch { sections = [] }
  return {
    id: row.id, name: row.name, role: row.role ?? '', school: row.school ?? '',
    bio: row.bio ?? '', instagram: row.instagram ?? '', image: row.image ?? '',
    sections, group: row.group_name ?? undefined,
    concertmasterType: row.concertmaster_type ?? undefined,
    isActive: row.is_active === 1, createdAt: row.created_at, updatedAt: row.updated_at,
  }
}
export function teamInputToColumns(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const pass = ['name','role','school','bio','instagram','image'] as const
  for (const k of pass) if (k in input && input[k] !== undefined) out[k] = input[k]
  if ('group' in input && input.group !== undefined) out.group_name = input.group
  if ('concertmasterType' in input && input.concertmasterType !== undefined) out.concertmaster_type = input.concertmasterType
  if ('isActive' in input && input.isActive !== undefined) out.is_active = input.isActive ? 1 : 0
  if ('sections' in input && input.sections !== undefined) out.sections = JSON.stringify(input.sections)
  return out
}

// ── Photos ──
export type PhotoRow = { id: string; url: string; r2_key: string; category: string; filename: string | null; uploaded_at: string }
export function serializePhoto(row: PhotoRow) {
  return { id: row.id, url: row.url, storagePath: row.r2_key, category: row.category, filename: row.filename ?? '', uploadedAt: row.uploaded_at }
}

// ── Activity logs ──
export type LogRow = { id: string; user_id: string | null; action: string; details: string | null; username: string | null; timestamp: string }
export function serializeLog(row: LogRow) {
  return { id: row.id, user_id: row.user_id ?? '', action: row.action, details: row.details ?? '', username: row.username ?? '', timestamp: row.timestamp }
}

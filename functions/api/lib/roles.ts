export const OWNER_EMAIL = 'iscurt.w@gmail.com'
const ADMIN_EMAILS = new Set(['on3keymusic@gmail.com', 'vanstringscm@gmail.com'])

export function roleForEmail(email: string): 'super_admin' | 'admin' | 'user' {
  if (email === OWNER_EMAIL) return 'super_admin'
  if (ADMIN_EMAILS.has(email)) return 'admin'
  return 'user'
}

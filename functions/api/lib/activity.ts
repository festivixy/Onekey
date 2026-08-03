export async function logActivity(
  db: D1Database,
  entry: { userId: string; action: string; details: string; username?: string },
): Promise<void> {
  try {
    await db.prepare(
      `INSERT INTO activity_logs (id, user_id, action, details, username, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      entry.userId,
      entry.action,
      entry.details,
      entry.username ?? '',
      new Date().toISOString(),
    ).run()
  } catch {
    // best-effort: logging must never break the action it records
  }
}

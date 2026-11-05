import { DurableObject } from "cloudflare:workers"
import type { FeedbackRecord } from "./feedback"

/**
 * Every rating from every thread, in one place, so it can be exported as eval
 * cases. Single instance, named "all". Holds questions and answers from
 * Slack, so the export endpoint needs FEEDBACK_EXPORT_TOKEN.
 */
export class MimeFeedback extends DurableObject<Record<string, unknown>> {
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env)
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS feedback (
      turn_id TEXT NOT NULL,
      rated_by TEXT NOT NULL,
      rating TEXT NOT NULL,
      rated_at INTEGER NOT NULL,
      record TEXT NOT NULL,
      PRIMARY KEY (turn_id, rated_by)
    )`)
  }

  /** A second click by the same person replaces their first. */
  record(record: FeedbackRecord) {
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO feedback (turn_id, rated_by, rating, rated_at, record)
       VALUES (?, ?, ?, ?, ?)`,
      record.turnId,
      record.ratedBy,
      record.rating,
      record.ratedAt,
      JSON.stringify(record),
    )
  }

  list(options: { rating?: string; limit?: number } = {}): FeedbackRecord[] {
    const limit = Math.min(Math.max(options.limit ?? 200, 1), 1000)
    const rows = options.rating
      ? this.ctx.storage.sql.exec<{ record: string }>(
          "SELECT record FROM feedback WHERE rating = ? ORDER BY rated_at DESC LIMIT ?",
          options.rating,
          limit,
        )
      : this.ctx.storage.sql.exec<{ record: string }>(
          "SELECT record FROM feedback ORDER BY rated_at DESC LIMIT ?",
          limit,
        )
    return rows.toArray().map(row => JSON.parse(row.record) as FeedbackRecord)
  }
}

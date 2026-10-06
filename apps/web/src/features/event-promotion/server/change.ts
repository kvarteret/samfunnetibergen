import { createHash } from "node:crypto"
import { z } from "zod"

const snapshot = z.object({
  promoted: z.boolean(),
  placement: z.enum(["top", "pool"]).nullable(),
  order: z.number().int().nonnegative().nullable(),
})

export const promotionChangeSchema = z.object({
  deleted: z.boolean().optional(),
  eventId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
  revision: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
  changedAt: z.iso.datetime({ offset: true }),
  slug: z.string().max(200).nullable(),
  title: z.string().max(500).nullable(),
  before: snapshot,
  after: snapshot,
})

export type PromotionChange = z.infer<typeof promotionChangeSchema>

export function promotionChangeId(change: PromotionChange) {
  return `promotion-${createHash("sha256").update(`${change.eventId}:${change.revision}`).digest("hex")}`
}

export function promotionChangeKind(change: PromotionChange) {
  if (!change.before.promoted && change.after.promoted) return "started"
  if (change.before.promoted && !change.after.promoted) return "ended"
  return "placement_changed"
}

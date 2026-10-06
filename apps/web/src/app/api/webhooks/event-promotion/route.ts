import type { NextRequest } from "next/server"
import { parseBody } from "next-sanity/webhook"
import {
  promotionChangeId,
  promotionChangeKind,
  promotionChangeSchema,
  promotionHistoryDocument,
} from "@/features/event-promotion/server/change"
import { getPostHogClient } from "@/lib/posthog-server"
import { sanityClient } from "@/lib/sanity/client"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_PROMOTION_WEBHOOK_SECRET
  const token = process.env.SANITY_PROMOTION_HISTORY_TOKEN
  if (!secret || !token)
    return Response.json({ error: "Not configured" }, { status: 503 })
  // Reject unsigned traffic before parsing; expected rejections are not logs.
  if (!request.headers.get("sanity-webhook-signature"))
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (Number(request.headers.get("content-length")) > 8192)
    return Response.json({ error: "Too large" }, { status: 413 })
  let parsed: Awaited<ReturnType<typeof parseBody>>
  try {
    const body = await request.text()
    if (new TextEncoder().encode(body).length > 8192)
      return Response.json({ error: "Too large" }, { status: 413 })
    parsed = await parseBody(
      new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body,
      }) as NextRequest,
      secret,
      false,
    )
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 })
  }
  if (parsed.isValidSignature !== true)
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  const result = promotionChangeSchema.safeParse(parsed.body)
  if (!result.success)
    return Response.json({ error: "Invalid change" }, { status: 400 })
  const change = result.data
  const client = sanityClient.withConfig({
    token,
    useCdn: false,
    apiVersion: "2025-02-19",
    stega: false,
  })
  try {
    // Freeze the first published slug; later URL changes keep this identity.
    const identity = await client.fetch<string | null>(
      `*[_id == $eventId][0].initialSlug`,
      { eventId: change.eventId },
    )
    if (!change.deleted && !identity && change.slug)
      await client
        .patch(change.eventId)
        .setIfMissing({ initialSlug: change.slug })
        .commit()
    if (JSON.stringify(change.before) === JSON.stringify(change.after))
      return Response.json({ skipped: true })
    if (!change.before.promoted && !change.after.promoted)
      return Response.json({ skipped: true })
    const campaignId =
      promotionChangeKind(change) === "started"
        ? promotionChangeId(change)
        : await client.fetch<string | null>(
            `*[_type == "eventPromotionChange" && eventId == $eventId && afterPromoted == true && beforePromoted == false && changedAt <= $changedAt] | order(changedAt desc)[0].campaignId`,
            change,
          )
    // Out-of-order delivery retries after its start record arrives.
    if (!campaignId)
      return Response.json({ error: "Campaign start pending" }, { status: 503 })
    const document = await client.createIfNotExists(
      promotionHistoryDocument(change, campaignId, new Date().toISOString()),
    )
    await getPostHogClient().captureImmediate({
      distinctId: `event:${change.eventId}`,
      event: "event_promotion_changed",
      timestamp: new Date(change.changedAt),
      properties: {
        $insert_id: document._id,
        $process_person_profile: false,
        event_id: identity ?? change.slug,
        event_document_id: change.eventId,
        event_slug: change.slug,
        event_title: change.title,
        promotion_campaign_id: campaignId,
        change: document.kind,
        before_promoted: change.before.promoted,
        is_promoted: change.after.promoted,
        before_placement: change.before.placement,
        promotion_placement: change.after.placement,
        before_order: change.before.order,
        promotion_order: change.after.order,
        observed_at: document.observedAt,
        campaign_start_known: document.startKnown,
        service: "samfunnetibergen-editorial",
      },
    })
    return Response.json({ recorded: true })
  } catch {
    console.error(
      "[event-promotion] POST failed to persist or export promotion change",
    )
    return Response.json({ error: "Retry change" }, { status: 502 })
  }
}

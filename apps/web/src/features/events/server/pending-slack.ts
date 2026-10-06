import { createHash } from "node:crypto"
import type { SanityClient } from "@sanity/client"
import { STUDIO_ORIGIN } from "@/lib/studio-url"

export type PendingRequest = {
  _id: string
  localizedTitle?: { language: string; value: string }[]
  submittedBy?: string
  ticketUrl?: string
  dates?: { startDate: string; startTime?: string; endTime?: string }[]
}

const escapeSlack = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
export function pendingMessage(event: PendingRequest): {
  text: string
  blocks: unknown[]
} {
  const title =
    event.localizedTitle?.find(item => item.language === "nb")?.value ||
    "Arrangement"
  const date = event.dates?.[0]
  const url = `${STUDIO_ORIGIN}/intent/edit/id=${encodeURIComponent(event._id.replace(/^drafts\./, ""))};type=arrangement/`
  const automatedWarning =
    event._id.replace(/^drafts\./, "").startsWith("ticketco-") &&
    event.ticketUrl
      ? `\nDette arrangementet var automatisk generert fra ${event.ticketUrl}. Se nøye gjennom!`
      : ""
  const summary = `Nytt arrangement til godkjenning: ${title}\n${date ? `${date.startDate} ${date.startTime ?? ""}–${date.endTime ?? ""}` : "Dato mangler"}\nInnsender: ${event.submittedBy || "Ukjent"}${automatedWarning}`
  return {
    text: summary,
    blocks: [
      {
        type: "section",
        text: { type: "plain_text", text: summary.slice(0, 2900) },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${escapeSlack(url)}|Åpne i Studio og vurder>`,
        },
      },
    ],
  }
}

// A receipt is separate from the arrangement so notification retries never
// change an editor's revision or accidentally publish a draft.
export async function notifyPendingRequest(
  client: SanityClient,
  event: PendingRequest,
): Promise<boolean> {
  const webhook = process.env.SLACK_NETTSIDE_WEBHOOK
  if (!webhook) return false
  const url = new URL(webhook)
  if (
    url.protocol !== "https:" ||
    url.hostname !== "hooks.slack.com" ||
    !url.pathname.startsWith("/services/")
  )
    throw new Error("Invalid #nettside webhook")
  const id = `pending-slack-${createHash("sha256")
    .update(event._id.replace(/^drafts\./, ""))
    .digest("hex")}`
  await client.createIfNotExists({ _id: id, _type: "pendingSlackDelivery" })
  const receipt = await client.getDocument<{
    _id: string
    _rev: string
    deliveredAt?: string
    leaseUntil?: string
  }>(id)
  if (
    !receipt ||
    receipt.deliveredAt ||
    Date.parse(receipt.leaseUntil ?? "") > Date.now()
  )
    return true
  let revision: string
  try {
    const lease = await client
      .patch(id)
      .ifRevisionId(receipt._rev)
      .set({ leaseUntil: new Date(Date.now() + 60000).toISOString() })
      .commit()
    revision = lease._rev
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409) return true
    throw error
  }
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(pendingMessage(event)),
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok || (await response.text()).trim() !== "ok")
      throw new Error("Slack delivery failed")
    await client
      .patch(id)
      .ifRevisionId(revision)
      .set({ deliveredAt: new Date().toISOString() })
      .unset(["leaseUntil"])
      .commit()
    return true
  } catch {
    await client.patch(id).ifRevisionId(revision).unset(["leaseUntil"]).commit()
    return false
  }
}

export async function syncPendingRequests(
  client: SanityClient,
): Promise<{ sentOrExisting: number; failed: number }> {
  if (!process.env.SLACK_NETTSIDE_WEBHOOK)
    throw new Error("SLACK_NETTSIDE_WEBHOOK is not configured")
  const events = await client.fetch<PendingRequest[]>(
    `*[_type == "arrangement" && approvalStatus == "pending"]{_id, localizedTitle, submittedBy, ticketUrl, dates}`,
  )
  let sentOrExisting = 0
  let failed = 0
  const seen = new Set<string>()
  for (const event of events) {
    const id = event._id.replace(/^drafts\./, "")
    if (seen.has(id)) continue
    seen.add(id)
    try {
      if (await notifyPendingRequest(client, event)) sentOrExisting++
      else failed++
    } catch {
      failed++
    }
  }
  return { sentOrExisting, failed }
}

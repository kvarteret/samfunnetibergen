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

function slackWebhook(): string | null {
  const webhook = process.env.SLACK_NETTSIDE_WEBHOOK
  if (!webhook) return null
  const url = new URL(webhook)
  if (
    url.protocol !== "https:" ||
    url.hostname !== "hooks.slack.com" ||
    !url.pathname.startsWith("/services/")
  )
    throw new Error("Invalid #nettside webhook")
  return webhook
}

function receiptId(event: PendingRequest) {
  return `pending-slack-${createHash("sha256")
    .update(event._id.replace(/^drafts\./, ""))
    .digest("hex")}`
}

// A receipt is separate from the arrangement so notification retries never
// change an editor's revision or accidentally publish a draft.
export async function notifyPendingRequest(
  client: SanityClient,
  event: PendingRequest,
): Promise<boolean> {
  const webhook = slackWebhook()
  if (!webhook) return false
  const id = receiptId(event)
  await client.createIfNotExists({ _id: id, _type: "pendingSlackDelivery" })
  const receipt = await client.getDocument<{
    _id: string
    _rev: string
    deliveredAt?: string
    claimedAt?: string
  }>(id)
  if (!receipt || receipt.deliveredAt || receipt.claimedAt) return true
  // Delivery is at most once: the claim is committed before posting and only
  // released when Slack definitively rejects the message. A crash or timeout
  // after the claim leaves it in place, so a request may go unannounced but is
  // never announced twice.
  let revision: string
  try {
    const claim = await client
      .patch(id)
      .ifRevisionId(receipt._rev)
      .set({ claimedAt: new Date().toISOString() })
      .commit()
    revision = claim._rev
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409) return true
    throw error
  }
  let response: Response
  try {
    response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(pendingMessage(event)),
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return false
  }
  if (!response.ok) {
    await client.patch(id).ifRevisionId(revision).unset(["claimedAt"]).commit()
    return false
  }
  await client
    .patch(id)
    .ifRevisionId(revision)
    .set({ deliveredAt: new Date().toISOString() })
    .commit()
  return true
}

async function pendingRequests(client: SanityClient) {
  const events = await client.fetch<PendingRequest[]>(
    `*[_type == "arrangement" && approvalStatus == "pending"]{_id, localizedTitle, submittedBy, ticketUrl, dates}`,
  )
  const seen = new Set<string>()
  return events.filter(event => {
    const id = event._id.replace(/^drafts\./, "")
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

/** Read-only: reports what a sync would announce without claiming or posting. */
export async function previewPendingRequests(
  client: SanityClient,
): Promise<{ wouldSend: number; alreadyAnnounced: number }> {
  if (!slackWebhook())
    throw new Error("SLACK_NETTSIDE_WEBHOOK is not configured")
  let wouldSend = 0
  let alreadyAnnounced = 0
  for (const event of await pendingRequests(client)) {
    const receipt = await client.getDocument<{
      deliveredAt?: string
      claimedAt?: string
    }>(receiptId(event))
    if (receipt?.deliveredAt || receipt?.claimedAt) alreadyAnnounced++
    else wouldSend++
  }
  return { wouldSend, alreadyAnnounced }
}

export async function syncPendingRequests(
  client: SanityClient,
): Promise<{ sentOrExisting: number; failed: number }> {
  if (!slackWebhook())
    throw new Error("SLACK_NETTSIDE_WEBHOOK is not configured")
  let sentOrExisting = 0
  let failed = 0
  for (const event of await pendingRequests(client)) {
    try {
      if (await notifyPendingRequest(client, event)) sentOrExisting++
      else failed++
    } catch {
      failed++
    }
  }
  return { sentOrExisting, failed }
}

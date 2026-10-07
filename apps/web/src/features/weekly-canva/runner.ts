import { createClient, type SanityClient } from "@sanity/client"
import { accessToken } from "./auth"
import { Canva, type Design, jobDesign, pageData, TEMPLATE_ID } from "./canva"
import { writeCopy } from "./copy"
import {
  type DayPage,
  planPages,
  readWeek,
  scheduleDue,
  type Week,
  weekFor,
} from "./plan"

export const LOCK_ID = "weekly-canva-lock"
type Part = { jobId?: string; design?: Design }
type Receipt = {
  _id: string
  _rev: string
  week: Week
  template: string
  pages?: DayPage[]
  images?: { url: string; assetId: string }[]
  parts?: Part[]
  mergeJob?: string
  mergedParts?: number
  design?: Design
  deliveredAt?: string
  empty?: boolean
}
export type Dependencies = {
  read: typeof readWeek
  copy: typeof writeCopy
  canva: (client: SanityClient) => Promise<Canva>
  notify: typeof notifyWeek
}
const defaults: Dependencies = {
  read: readWeek,
  copy: writeCopy,
  canva: async client => new Canva(await accessToken(client)),
  notify: notifyWeek,
}

export function weeklyClient(requireWrite = true): SanityClient {
  if (requireWrite && !process.env.SANITY_WRITE_TOKEN)
    throw new Error("Configure SANITY_WRITE_TOKEN")
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "mkjoahvv",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    token: process.env.SANITY_WRITE_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
    perspective: "raw",
  })
}

export function webhookUrl(): string {
  const value = process.env.SLACK_NETTSIDE_WEBHOOK
  if (!value) throw new Error("Configure SLACK_NETTSIDE_WEBHOOK")
  const url = new URL(value)
  if (
    url.protocol !== "https:" ||
    url.hostname !== "hooks.slack.com" ||
    !url.pathname.startsWith("/services/") ||
    url.username ||
    url.password
  )
    throw new Error("Invalid nettside webhook")
  return value
}

export async function notifyWeek(week: Week, design?: Design): Promise<void> {
  const summary = design
    ? `Skonk har laget Ukas post ${week.number} (${week.from}–${week.to}). Se over tekst, bilder og layout før publisering.`
    : `Ingen godkjente offentlige arrangementer for uke ${week.number} (${week.from}–${week.to}). Skonk laget ingen Ukas post.`
  const response = await fetch(webhookUrl(), {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text: `${summary}${design ? `\n${design.urls.edit_url}` : ""}`,
      blocks: [
        { type: "section", text: { type: "plain_text", text: summary } },
        ...(design
          ? [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `<${design.urls.edit_url.replace(/&/g, "&amp;")}|Åpne Ukas post i Canva>`,
                },
              },
            ]
          : []),
      ],
    }),
  })
  if (!response.ok || (await response.text()).trim() !== "ok")
    throw new Error("Weekly Canva Slack delivery failed")
}

export async function runWeekly(
  client: SanityClient,
  options: {
    dryRun?: boolean
    scheduled?: boolean
    monday?: string
    now?: Date
  } = {},
  deps: Dependencies = defaults,
): Promise<Record<string, unknown>> {
  const now = options.now ?? new Date()
  if (options.scheduled && !scheduleDue(now)) return { status: "not-due" }
  const week = weekFor(now, options.monday)
  if (options.dryRun) {
    const events = await deps.copy(await deps.read(week))
    return {
      status: "dry-run",
      week,
      events: events.length,
      pages: planPages(events),
    }
  }
  webhookUrl()
  await client.createIfNotExists({ _id: LOCK_ID, _type: "weeklyCanvaLock" })
  const lock = await client.getDocument<{
    _id: string
    _rev: string
    leaseUntil?: string
  }>(LOCK_ID)
  if (!lock) throw new Error("Weekly Canva lock unavailable")
  if (Date.parse(lock.leaseUntil ?? "") > Date.now()) return { status: "busy" }
  let revision: string
  try {
    revision = (
      await client
        .patch(LOCK_ID)
        .ifRevisionId(lock._rev)
        .set({ leaseUntil: new Date(Date.now() + 45 * 60000).toISOString() })
        .commit()
    )._rev
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409)
      return { status: "busy" }
    throw error
  }
  try {
    const id = `weekly-canva-${week.from}`
    await client.createIfNotExists({
      _id: id,
      _type: "weeklyCanvaDelivery",
      week,
      template: process.env.CANVA_WEEKLY_TEMPLATE_DESIGN_ID || TEMPLATE_ID,
    })
    let receipt: Receipt | undefined =
      (await client.getDocument<Receipt>(id)) ?? undefined
    if (!receipt) throw new Error("Weekly Canva receipt unavailable")
    if (receipt.deliveredAt)
      return { status: "already-delivered", week, design: receipt.design }
    async function save(values: Partial<Receipt>) {
      if (!receipt) throw new Error("Weekly Canva receipt unavailable")
      receipt = (await client
        .patch(id)
        .ifRevisionId(receipt._rev)
        .set(values)
        .commit()) as Receipt
    }
    if (!receipt.pages) {
      const events = await deps.copy(await deps.read(week))
      await save({
        pages: planPages(events),
        empty: !events.length,
        parts: [],
        images: [],
        mergedParts: 0,
      })
    }
    if (receipt.empty) {
      await deps.notify(week)
      await save({ deliveredAt: new Date().toISOString() })
      return { status: "empty", week }
    }
    if (
      !receipt.design ||
      (receipt.mergedParts ?? 0) < (receipt.pages?.length ?? 0) + 2
    ) {
      const canva = await deps.canva(client)
      await canva.dataset(receipt.template)
      const images = Object.fromEntries(
        (receipt.images ?? []).map(item => [item.url, item.assetId]),
      )
      for (const event of receipt.pages?.flatMap(p => p.events) ?? []) {
        if (event.imageUrl && !images[event.imageUrl]) {
          images[event.imageUrl] = await canva.uploadImage(event.imageUrl)
          await save({
            images: Object.entries(images).map(([url, assetId]) => ({
              url,
              assetId,
            })),
          })
        }
      }
      const cover = Object.values(images).slice(0, 3)
      // First copy supplies cover; last supplies the volunteer page.
      const pages = [undefined, ...(receipt.pages ?? []), undefined]
      const parts = [...(receipt.parts ?? [])]
      const title = `Ukas post ${week.number} (${week.year})`
      for (let i = 0; i < pages.length; i++) {
        let part = parts[i] ?? {}
        if (!part.jobId && !part.design) {
          part = {
            jobId: await canva.autofill(
              receipt.template,
              `${title} – del ${i + 1}`,
              pageData(week, pages[i], images, cover),
            ),
          }
          parts[i] = part
          await save({ parts })
        }
        if (!part.design && part.jobId) {
          part = {
            ...part,
            design: jobDesign(await canva.poll("autofills", part.jobId)),
          }
          parts[i] = part
          await save({ parts })
        }
      }
      for (let i = receipt.mergedParts ?? 0; i < parts.length; i++) {
        const source = parts[i].design
        if (!source) throw new Error("Canva part missing")
        if (!receipt.mergeJob) {
          const page = i === 0 ? 1 : i === parts.length - 1 ? 7 : 2
          await save({
            mergeJob: await canva.merge(
              source.id,
              [page],
              title,
              receipt.design?.id,
            ),
          })
        }
        const design = jobDesign(
          await canva.poll("merges", receipt.mergeJob as string),
        )
        await save({ design, mergedParts: i + 1, mergeJob: "" })
      }
    }
    await deps.notify(week, receipt.design)
    await save({ deliveredAt: new Date().toISOString() })
    return {
      status: "complete",
      week,
      pages: (receipt.pages?.length ?? 0) + 2,
      design: receipt.design,
    }
  } finally {
    await client
      .patch(LOCK_ID)
      .ifRevisionId(revision)
      .unset(["leaseUntil"])
      .commit()
  }
}

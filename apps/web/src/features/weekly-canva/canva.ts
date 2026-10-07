import { setTimeout } from "node:timers/promises"
import { z } from "zod"
import type { DayPage, Week } from "./plan"

export const TEMPLATE_ID = "DAHXWWAf59c"
export const PLACEHOLDER_IMAGE = "MAHTehiy2v4"
const designSchema = z.object({
  id: z.string().min(1),
  urls: z.object({ edit_url: z.url() }),
})
export type Design = z.infer<typeof designSchema>
export type AutofillData = Record<
  string,
  { type: "text"; text: string } | { type: "image"; asset_id: string }
>
export type CanvaJob = {
  id: string
  status: string
  result?: { design?: Design }
  asset?: { id: string }
}

export class Canva {
  constructor(
    private readonly token: string,
    private readonly requestFetch: typeof fetch = fetch,
  ) {}

  async request<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.requestFetch(
      `https://api.canva.com/rest/v1/${path}`,
      {
        method: body === undefined ? "GET" : "POST",
        signal: AbortSignal.timeout(30000),
        headers: {
          authorization: `Bearer ${this.token}`,
          "content-type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
    )
    if (!response.ok) throw new Error(`Canva HTTP ${response.status}`)
    return (await response.json()) as T
  }

  async dataset(template: string): Promise<void> {
    const { dataset } = await this.request<{
      dataset: Record<string, { type: string }>
    }>(`designs/${encodeURIComponent(template)}/dataset`)
    for (const [name, type] of Object.entries(requiredDataset())) {
      if (dataset?.[name]?.type !== type)
        throw new Error(`Canva template field missing or wrong type: ${name}`)
    }
  }

  async poll(
    kind: "autofills" | "merges" | "asset-uploads",
    id: string,
  ): Promise<CanvaJob> {
    for (let attempt = 0; attempt < 90; attempt++) {
      const { job } = await this.request<{ job: CanvaJob }>(
        `${kind}/${encodeURIComponent(id)}`,
      )
      if (job.status === "success") return job
      if (job.status !== "in_progress")
        throw new Error(`Canva ${kind} job failed`)
      await setTimeout(2000)
    }
    throw new Error(`Canva ${kind} job timed out; retry to resume`)
  }

  async autofill(
    template: string,
    title: string,
    data: AutofillData,
  ): Promise<string> {
    const { job } = await this.request<{ job: CanvaJob }>("autofills", {
      type: "create_from_design",
      design_id: template,
      title,
      data,
    })
    if (!job?.id) throw new Error("Canva autofill response missing job id")
    return job.id
  }

  async merge(
    source: string,
    pageNumbers: number[],
    title: string,
    target?: string,
  ): Promise<string> {
    const { job } = await this.request<{ job: CanvaJob }>("merges", {
      type: target ? "modify_existing_design" : "create_new_design",
      ...(target ? { design_id: target } : {}),
      title,
      operations: [
        {
          type: "insert_pages",
          source: {
            type: "design",
            design_id: source,
            page_numbers: pageNumbers,
          },
        },
      ],
    })
    if (!job?.id) throw new Error("Canva merge response missing job id")
    return job.id
  }

  async uploadImage(url: string): Promise<string> {
    const parsed = new URL(url)
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "cdn.sanity.io" ||
      parsed.username ||
      parsed.password
    )
      throw new Error("Weekly images must come from Sanity CDN")
    const { job } = await this.request<{ job: CanvaJob }>("url-asset-uploads", {
      name: "Weekly Kvarteret event",
      url,
    })
    // URL uploads have their own status endpoint.
    for (let attempt = 0; attempt < 90; attempt++) {
      const { job: state } = await this.request<{ job: CanvaJob }>(
        `url-asset-uploads/${encodeURIComponent(job.id)}`,
      )
      if (state.status === "success" && state.asset?.id) return state.asset.id
      if (state.status !== "in_progress")
        throw new Error("Canva image upload failed")
      await setTimeout(2000)
    }
    throw new Error("Canva image upload timed out")
  }
}

export function requiredDataset(): Record<string, string> {
  const fields: Record<string, string> = {
    week_number: "text",
    day_heading: "text",
  }
  for (let i = 1; i <= 3; i++) fields[`cover_image_${i}`] = "image"
  for (let i = 1; i <= 2; i++) {
    for (const suffix of ["title", "description", "location_time"])
      fields[`event_${i}_${suffix}`] = "text"
    fields[`event_${i}_image`] = "image"
  }
  return fields
}

export function pageData(
  week: Week,
  page: DayPage | undefined,
  images: Record<string, string>,
  cover: string[],
): AutofillData {
  const data: AutofillData = {
    week_number: { type: "text", text: String(week.number) },
    day_heading: { type: "text", text: page?.heading ?? "" },
  }
  for (let i = 1; i <= 3; i++)
    data[`cover_image_${i}`] = {
      type: "image",
      asset_id: cover[(i - 1) % cover.length] || PLACEHOLDER_IMAGE,
    }
  for (let i = 1; i <= 2; i++) {
    const event = page?.events[i - 1]
    data[`event_${i}_title`] = { type: "text", text: event?.title ?? "" }
    data[`event_${i}_description`] = {
      type: "text",
      text: event?.description ?? "",
    }
    data[`event_${i}_location_time`] = {
      type: "text",
      text: event?.locationTime ?? "",
    }
    data[`event_${i}_image`] = {
      type: "image",
      asset_id:
        (event?.imageUrl && images[event.imageUrl]) || PLACEHOLDER_IMAGE,
    }
  }
  return data
}

export function jobDesign(job: CanvaJob): Design {
  const design = designSchema.parse(job.result?.design)
  const url = new URL(design.urls.edit_url)
  if (
    url.protocol !== "https:" ||
    !["canva.com", "www.canva.com"].includes(url.hostname)
  )
    throw new Error("Invalid Canva edit URL")
  return design
}

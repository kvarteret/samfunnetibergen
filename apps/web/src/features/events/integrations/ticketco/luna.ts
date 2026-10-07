import { randomUUID } from "node:crypto"
import { z } from "zod"
import { getTicketCoPrompt } from "./prompt"
import type { ImportOption, RoomCandidate } from "./rooms"
import type { TicketCoEvent } from "./source"
import { captureLunaGeneration, type LunaUsage } from "./telemetry"

// Submitter identity, source link and recurrence are controlled by the importer.
const modelSchema = z.object({
  title: z.string(),
  titleEnglish: z.string(),
  description: z.string(),
  descriptionEnglish: z.string(),
  startDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string(),
  roomText: z.string(),
  roomTextEnglish: z.string(),
  organizerGroup: z.string(),
  organizerText: z.string(),
  organizerTextEnglish: z.string(),
  submittedByOrganization: z.string(),
  eventTypeId: z.string(),
  isFree: z.boolean(),
  isSoldOut: z.boolean(),
  priceOrdinar: z.string(),
  priceStudent: z.string(),
  priceMedlem: z.string(),
  facebookUrl: z.string(),
  evidence: z.string(),
})
export type Extraction = z.infer<typeof modelSchema>
export type ImportTaxonomy = {
  rooms: ImportOption[]
  groups: ImportOption[]
  eventTypes: ImportOption[]
}

export async function extractWithLuna(
  source: TicketCoEvent,
  text: string,
  taxonomy: ImportTaxonomy,
  candidates: RoomCandidate[],
  options: { traceId?: string } = {},
): Promise<Extraction> {
  const endpoint =
    process.env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_BASE_URL
  const key = process.env.AZURE_OPENAI_API_KEY
  if (!endpoint || !key)
    throw new Error("Configure AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY")
  const base = new URL(endpoint)
  if (base.protocol !== "https:" || base.username || base.password)
    throw new Error("Azure endpoint must be HTTPS")
  const deployment = process.env.AZURE_OPENAI_LUNA_DEPLOYMENT || "skonk"
  const traceId = options.traceId ?? randomUUID()
  const prompt = await getTicketCoPrompt()
  const started = performance.now()
  let usage: LunaUsage | undefined
  let extraction: Extraction | undefined
  let httpStatus: number | undefined
  let failure: string | undefined
  let stage = "request"
  try {
    const response = await fetch(
      `${endpoint.replace(/\/$/, "").replace(/\/openai\/v1$/, "")}/openai/v1/responses`,
      {
        method: "POST",
        signal: AbortSignal.timeout(120000),
        headers: { "api-key": key, "content-type": "application/json" },
        body: JSON.stringify({
          model: deployment,
          store: false,
          max_output_tokens: 12000,
          instructions: prompt.prompt,
          input: JSON.stringify({
            source,
            displayedText: text,
            taxonomy,
            overlappingBookings: candidates,
          }),
          text: {
            format: {
              type: "json_schema",
              name: "ticketco_event",
              strict: true,
              schema: z.toJSONSchema(modelSchema),
            },
          },
        }),
      },
    )
    httpStatus = response.status
    if (!response.ok) throw new Error(`Luna HTTP ${response.status}`)
    stage = "response_json"
    const body = (await response.json()) as {
      model?: string
      usage?: LunaUsage
      status?: string
      output?: { content?: { type: string; text?: string }[] }[]
    }
    usage = body.usage
    stage = "completion"
    if (body.status !== "completed") throw new Error("Luna response incomplete")
    const output = body.output
      ?.flatMap(item => item.content ?? [])
      .filter(item => item.type === "output_text")
      .map(item => item.text ?? "")
      .join("")
    if (!output) throw new Error("Luna returned no structured output")
    stage = "structured_output"
    extraction = modelSchema.parse(JSON.parse(output))
    return extraction
  } catch (error) {
    // Fixed labels avoid sending source content, Zod values or secrets in errors.
    failure =
      httpStatus && httpStatus >= 400
        ? `Luna HTTP ${httpStatus}`
        : `Luna ${stage} failed`
    throw error
  } finally {
    await captureLunaGeneration({
      traceId,
      source,
      model: "gpt-6-luna",
      deployment,
      latency: (performance.now() - started) / 1000,
      usage,
      output: extraction,
      error: failure,
      httpStatus,
      prompt: {
        name: prompt.name,
        version: prompt.version,
        source: prompt.source,
      },
    })
  }
}

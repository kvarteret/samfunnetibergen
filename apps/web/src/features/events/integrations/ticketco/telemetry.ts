import { randomUUID } from "node:crypto"
import { getPostHogReleaseProperties } from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"
import type { TicketCoEvent } from "./source"

export type LunaUsage = {
  input_tokens?: number
  output_tokens?: number
}

/** Separates PostHog traces of the scheduled importer and Studio imports. */
export type LunaWorkflow = {
  name: string
  distinctId: string
  spanName: string
}

export const TICKETCO_WORKFLOW: LunaWorkflow = {
  name: "ticketco_import",
  distinctId: "ticketco-importer",
  spanName: "TicketCo event extraction",
}

export type LunaGeneration = {
  traceId: string
  workflow?: LunaWorkflow
  source: TicketCoEvent
  model: string
  deployment: string
  latency: number
  usage?: LunaUsage
  output?: Record<string, unknown>
  error?: string
  prompt?: { name?: string; version?: number; source: string }
  httpStatus?: number
}

/** Record public source and validated fields, never private calendar context. */
export async function captureLunaGeneration(generation: LunaGeneration) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return
  const { evidence: _privateEvidence, ...output } = generation.output ?? {}
  const workflow = generation.workflow ?? TICKETCO_WORKFLOW
  try {
    const release = getPostHogReleaseProperties()
    await getPostHogClient().captureImmediate({
      distinctId: workflow.distinctId,
      event: "$ai_generation",
      properties: {
        ...release,
        workflow: workflow.name,
        azure_deployment: generation.deployment,
        environment: process.env.GITHUB_ACTIONS
          ? "production"
          : release.environment,
        git_sha: process.env.GITHUB_SHA ?? release.git_sha,
        ticket_url: generation.source.url,
        source_url: generation.source.url,
        $ai_trace_id: generation.traceId,
        $ai_generation_id: randomUUID(),
        $ai_parent_id: generation.traceId,
        $ai_session_id: null,
        $ai_span_name: workflow.spanName,
        $ai_prompt_name: generation.prompt?.name,
        $ai_prompt_version: generation.prompt?.version,
        prompt_source: generation.prompt?.source,
        $ai_model: generation.model,
        $ai_provider: "azure",
        $ai_input: [
          { role: "user", content: JSON.stringify(generation.source) },
        ],
        $ai_output_choices: generation.output
          ? [{ role: "assistant", content: JSON.stringify(output) }]
          : [],
        $ai_input_tokens: generation.usage?.input_tokens,
        $ai_output_tokens: generation.usage?.output_tokens,
        $ai_latency: generation.latency,
        $ai_stream: false,
        $ai_is_error: Boolean(generation.error),
        $ai_error: generation.error,
        $ai_http_status: generation.httpStatus,
        context_redacted: true,
      },
    })
  } catch {
    // Analytics failures must not lose an otherwise valid event import.
    process.stderr.write("TicketCo AI analytics delivery failed.\n")
  }
}

/** Show the importer outcome separately from provisional model output. */
export type ImportOutcome = {
  status: "pending" | "draft" | "merged" | "skipped" | "dry-run" | "failed"
  room?: string
  reason?: string
}

export async function captureRoomResolution(
  traceId: string,
  ticketUrl: string,
  outcome: ImportOutcome,
  workflow: LunaWorkflow = TICKETCO_WORKFLOW,
) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return
  const accepted = ["pending", "draft", "merged", "dry-run"].includes(
    outcome.status,
  )
  try {
    await getPostHogClient().captureImmediate({
      distinctId: workflow.distinctId,
      event: "$ai_span",
      properties: {
        $ai_trace_id: traceId,
        $ai_parent_id: traceId,
        $ai_span_id: `${traceId}-validation`,
        $ai_span_name: "Import validation and room resolution",
        $ai_output_state: {
          room: outcome.room || null,
          accepted,
          status: outcome.status,
          reason: outcome.reason,
        },
        $ai_is_error: outcome.status === "failed",
        $ai_error: outcome.status === "failed" ? outcome.reason : undefined,
        ticket_url: ticketUrl,
      },
    })
  } catch {
    process.stderr.write("TicketCo room analytics delivery failed.\n")
  }
}

import { getPostHogReleaseProperties } from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"
import type { TicketCoEvent } from "./source"

export type LunaUsage = {
  input_tokens?: number
  output_tokens?: number
}

export type LunaGeneration = {
  traceId: string
  source: TicketCoEvent
  model: string
  latency: number
  usage?: LunaUsage
  output?: Record<string, unknown>
  error?: string
  httpStatus?: number
}

/** Record public source and validated fields, never private calendar context. */
export async function captureLunaGeneration(generation: LunaGeneration) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return
  const { evidence: _privateEvidence, ...output } = generation.output ?? {}
  try {
    const release = getPostHogReleaseProperties()
    await getPostHogClient().captureImmediate({
      distinctId: "ticketco-importer",
      event: "$ai_generation",
      properties: {
        ...release,
        workflow: "ticketco_import",
        environment: process.env.GITHUB_ACTIONS
          ? "production"
          : release.environment,
        git_sha: process.env.GITHUB_SHA ?? release.git_sha,
        ticket_url: generation.source.url,
        $ai_trace_id: generation.traceId,
        $ai_generation_id: generation.traceId,
        $ai_parent_id: generation.traceId,
        $ai_session_id: null,
        $ai_span_name: "TicketCo event extraction",
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

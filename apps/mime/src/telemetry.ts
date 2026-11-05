// PostHog LLM analytics for Mime, over PostHog's capture API (no SDK in the
// Worker). One `$ai_generation` per answer and one `$ai_metric` per 👍/👎, so
// answers, cost, latency, tools and ratings line up by trace in PostHog.
//
// By default no Slack text is sent: questions and answers stay in Mime's own
// feedback store. POSTHOG_CONTENT=on also sends them, for reviewing traces in
// PostHog.

export type TelemetryEnv = {
  /** PostHog project API key (phc_…), the same one the website uses. */
  POSTHOG_PROJECT_TOKEN?: string
  POSTHOG_HOST?: string
  POSTHOG_CONTENT?: string
  AZURE_OPENAI_LUNA_DEPLOYMENT: string
}

type Fetch = typeof fetch

const DEFAULT_HOST = "https://eu.i.posthog.com"

export type GenerationEvent = {
  traceId: string
  user: string
  question: string
  answer: string
  tools: string[]
  inputTokens?: number
  outputTokens?: number
  latencySeconds: number
  steps: number
  error?: string
}

function distinctId(user: string) {
  return `mime:slack:${user}`
}

export function generationEvent(env: TelemetryEnv, event: GenerationEvent) {
  const content = env.POSTHOG_CONTENT === "on"
  return {
    event: "$ai_generation",
    distinct_id: distinctId(event.user),
    properties: {
      $process_person_profile: false,
      workflow: "mime",
      $ai_trace_id: event.traceId,
      $ai_span_name: "Mime Slack answer",
      // The repository's PostHog policy: AI events name the `skonk` deployment.
      $ai_model: env.AZURE_OPENAI_LUNA_DEPLOYMENT,
      $ai_provider: "azure",
      $ai_input: content
        ? [{ role: "user", content: event.question }]
        : undefined,
      $ai_output_choices: content
        ? [{ role: "assistant", content: event.answer }]
        : undefined,
      $ai_input_tokens: event.inputTokens,
      $ai_output_tokens: event.outputTokens,
      $ai_latency: event.latencySeconds,
      $ai_stream: true,
      $ai_is_error: Boolean(event.error),
      $ai_error: event.error,
      $ai_tools_called: event.tools,
      tool_count: event.tools.length,
      step_count: event.steps,
      answer_length: event.answer.length,
      context_redacted: !content,
    },
  }
}

export function feedbackEvent(
  traceId: string,
  user: string,
  rating: "positive" | "negative",
) {
  return {
    event: "$ai_metric",
    distinct_id: distinctId(user),
    properties: {
      $process_person_profile: false,
      workflow: "mime",
      $ai_trace_id: traceId,
      $ai_metric_name: "feedback",
      $ai_metric_value: rating === "positive" ? "good" : "bad",
      rating,
    },
  }
}

/** Fire-and-forget; analytics never breaks an answer. */
export async function capture(
  env: TelemetryEnv,
  events: Record<string, unknown>[],
  fetchFn: Fetch = (input, init) => fetch(input, init),
) {
  const token = env.POSTHOG_PROJECT_TOKEN
  if (!token || !events.length) return
  const host = (env.POSTHOG_HOST || DEFAULT_HOST).replace(/\/$/, "")
  try {
    await fetchFn(`${host}/batch/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: token,
        batch: events.map(event => ({
          ...event,
          timestamp: new Date().toISOString(),
        })),
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Dropped: PostHog is down or slow.
  }
}

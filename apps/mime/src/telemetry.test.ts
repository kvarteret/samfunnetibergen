import { describe, expect, test, vi } from "vitest"
import { capture, feedbackEvent, generationEvent } from "./telemetry"

const env = {
  AZURE_OPENAI_LUNA_DEPLOYMENT: "skonk",
  POSTHOG_PROJECT_TOKEN: "phc_x",
}
const event = {
  traceId: "ab12cd34",
  user: "U1",
  question: "arrangement i dag?",
  answer: "To arrangementer.",
  tools: ["find_events"],
  latencySeconds: 2,
  steps: 2,
}

describe("PostHog events", () => {
  test("no Slack text unless POSTHOG_CONTENT=on", () => {
    const hidden = generationEvent(env, event).properties
    expect(hidden.$ai_input).toBeUndefined()
    expect(hidden.$ai_model).toBe("skonk")
    expect(hidden.context_redacted).toBe(true)
    const shown = generationEvent(
      { ...env, POSTHOG_CONTENT: "on" },
      event,
    ).properties
    expect(JSON.stringify(shown.$ai_input)).toContain("arrangement i dag?")
  })
  test("feedback is a metric on the answer's trace", () => {
    expect(
      feedbackEvent("ab12cd34", "U1", "negative").properties,
    ).toMatchObject({
      $ai_trace_id: "ab12cd34",
      $ai_metric_name: "feedback",
      $ai_metric_value: "bad",
    })
  })
  test("capture batches to PostHog and is off without a token", async () => {
    const fetchFn = vi.fn(async () => new Response("{}"))
    await capture(
      { ...env, POSTHOG_PROJECT_TOKEN: undefined },
      [{}],
      fetchFn as never,
    )
    expect(fetchFn).not.toHaveBeenCalled()
    await capture(
      env,
      [feedbackEvent("ab12cd34", "U1", "positive")],
      fetchFn as never,
    )
    const [url, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toBe("https://eu.i.posthog.com/batch/")
    expect(JSON.parse(init.body as string)).toMatchObject({ api_key: "phc_x" })
  })
})

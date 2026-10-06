import { afterEach, expect, test, vi } from "vitest"
import { captureLunaGeneration } from "./telemetry"

const capture = vi.hoisted(() => vi.fn())
vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ captureImmediate: capture }),
}))
const generation = {
  traceId: "trace-test",
  source: {
    "@type": "Event" as const,
    name: "Concert",
    url: "https://asf.ticketco.events/no/nb/e/concert",
  },
  model: "gpt-6-luna",
  latency: 2.5,
  usage: { input_tokens: 100, output_tokens: 50 },
  output: { title: "Artist", evidence: "PRIVATE INTERNAL BOOKING" },
}
afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

test("awaits generation delivery and excludes private booking evidence", async () => {
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "test")
  await captureLunaGeneration(generation)
  const event = capture.mock.calls[0][0]
  expect(event).toMatchObject({
    event: "$ai_generation",
    distinctId: "ticketco-importer",
    properties: {
      $ai_trace_id: "trace-test",
      $ai_latency: 2.5,
      $ai_input_tokens: 100,
      $ai_output_tokens: 50,
      $ai_session_id: null,
      $ai_is_error: false,
      context_redacted: true,
    },
  })
  expect(JSON.stringify(event)).not.toContain("PRIVATE INTERNAL BOOKING")
  expect(event.properties.$ai_output_choices[0].content).toBe(
    '{"title":"Artist"}',
  )
})
test("does nothing when PostHog is not configured", async () => {
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "")
  await captureLunaGeneration(generation)
  expect(capture).not.toHaveBeenCalled()
})
test("analytics failures do not fail event extraction", async () => {
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "test")
  capture.mockRejectedValueOnce(new Error("offline"))
  const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true)
  await expect(captureLunaGeneration(generation)).resolves.toBeUndefined()
  stderr.mockRestore()
})

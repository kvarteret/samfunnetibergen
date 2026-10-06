import { afterEach, expect, test, vi } from "vitest"

const get = vi.fn()
const constructPrompts = vi.fn()
vi.mock("@posthog/ai", () => ({
  Prompts: class {
    constructor(options: unknown) {
      constructPrompts(options)
    }
    get = get
  },
}))
afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})
test("uses the checked-in prompt without runtime keys", async () => {
  vi.stubEnv("POSTHOG_API_KEY", "")
  const { getTicketCoPrompt, TICKETCO_FALLBACK_PROMPT } = await import(
    "./prompt"
  )
  expect(await getTicketCoPrompt()).toMatchObject({
    source: "code_fallback",
    prompt: TICKETCO_FALLBACK_PROMPT,
    version: undefined,
  })
  expect(get).not.toHaveBeenCalled()
})
test("fetches production label with fallback and returns version metadata", async () => {
  vi.stubEnv("POSTHOG_API_KEY", "test-server-key")
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "test-project")
  get.mockResolvedValue({
    prompt: "Managed instructions",
    name: "ticketco-event-extraction",
    version: 2,
    source: "api",
  })
  const { getTicketCoPrompt, TICKETCO_FALLBACK_PROMPT } = await import(
    "./prompt"
  )
  expect(await getTicketCoPrompt()).toMatchObject({ version: 2, source: "api" })
  expect(constructPrompts).toHaveBeenCalledWith({
    personalApiKey: "test-server-key",
    projectApiKey: "test-project",
    host: "https://eu.posthog.com",
  })
  expect(get).toHaveBeenCalledWith("ticketco-event-extraction", {
    label: "production",
    fallback: TICKETCO_FALLBACK_PROMPT,
  })
})

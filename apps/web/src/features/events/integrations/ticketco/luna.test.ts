import { afterEach, expect, test, vi } from "vitest"
import { extractWithLuna } from "./luna"
import { captureLunaGeneration } from "./telemetry"

vi.mock("./telemetry", () => ({ captureLunaGeneration: vi.fn() }))
const source = {
  "@type": "Event" as const,
  name: "HLNA // ASF // Kvarteret",
  url: "https://asf.ticketco.events/no/nb/e/hlna",
}
const fields = {
  title: "HLNA",
  titleEnglish: "HLNA",
  description: "Konsert",
  descriptionEnglish: "Concert",
  startDate: "2026-10-16",
  startTime: "21:00",
  endTime: "01:00",
  room: "tegl",
  roomText: "",
  roomTextEnglish: "",
  organizerGroup: "",
  organizerText: "",
  organizerTextEnglish: "",
  submittedByOrganization: "",
  eventTypeId: "",
  isFree: false,
  isSoldOut: false,
  priceOrdinar: "200",
  priceStudent: "100",
  priceMedlem: "",
  facebookUrl: "",
  evidence: "Private booking evidence",
}
function configure() {
  vi.stubEnv("AZURE_OPENAI_ENDPOINT", "https://example.openai.azure.com")
  vi.stubEnv("AZURE_OPENAI_API_KEY", "test-secret")
  vi.stubEnv("AZURE_OPENAI_LUNA_DEPLOYMENT", "")
}
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

test("uses Luna's editorial title unchanged and captures real token usage", async () => {
  configure()
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(
        JSON.stringify({
          status: "completed",
          usage: { input_tokens: 1250, output_tokens: 200 },
          output: [
            {
              content: [{ type: "output_text", text: JSON.stringify(fields) }],
            },
          ],
        }),
      ),
  )
  vi.stubGlobal("fetch", fetch)
  expect(
    await extractWithLuna(
      source,
      "Public ticket page",
      { rooms: [], groups: [], eventTypes: [] },
      [],
    ),
  ).toEqual(fields)
  const request = JSON.parse(String(fetch.mock.calls[0][1]?.body))
  expect(request.model).toBe("skonk")
  expect(request.instructions).toContain(
    "Editorialize title and titleEnglish to artist names only",
  )
  expect(captureLunaGeneration).toHaveBeenCalledWith(
    expect.objectContaining({
      source,
      model: "gpt-6-luna",
      deployment: "skonk",
      usage: { input_tokens: 1250, output_tokens: 200 },
      output: fields,
      error: undefined,
      httpStatus: 200,
    }),
  )
})

test("captures failed API calls without swallowing import errors", async () => {
  configure()
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("secret provider body", { status: 429 })),
  )
  await expect(
    extractWithLuna(
      source,
      "text",
      { rooms: [], groups: [], eventTypes: [] },
      [],
    ),
  ).rejects.toThrow("Luna HTTP 429")
  expect(captureLunaGeneration).toHaveBeenCalledWith(
    expect.objectContaining({ error: "Luna HTTP 429", httpStatus: 429 }),
  )
})

test("captures malformed model output using a safe error label", async () => {
  configure()
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "completed",
            output: [
              {
                content: [
                  { type: "output_text", text: "private invalid output" },
                ],
              },
            ],
          }),
        ),
    ),
  )
  await expect(
    extractWithLuna(
      source,
      "text",
      { rooms: [], groups: [], eventTypes: [] },
      [],
    ),
  ).rejects.toThrow()
  expect(captureLunaGeneration).toHaveBeenCalledWith(
    expect.objectContaining({
      error: "Luna structured_output failed",
      output: undefined,
    }),
  )
})

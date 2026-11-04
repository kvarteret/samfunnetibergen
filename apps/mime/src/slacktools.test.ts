import { describe, expect, test, vi } from "vitest"
import { SlackClient, slackTools } from "./slack"

describe("read_thread", () => {
  const fetcher = vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          ok: true,
          messages: [
            { ts: "1.1", user: "U1", text: "hei" },
            { ts: "1.2", bot_id: "B1", username: "Mime", text: "svar" },
          ],
        }),
      ),
  )

  test("stays in the turn's channel and defaults to its thread", async () => {
    const tools = slackTools(
      new SlackClient("xoxb-test", fetcher as never),
      "C1",
      "9.9",
    )
    const result = await tools.read_thread.execute?.({}, {} as never)
    const body = (fetcher.mock.calls[0] as unknown as [string, RequestInit])[1]
      .body as URLSearchParams
    expect(body.get("channel")).toBe("C1")
    expect(body.get("ts")).toBe("9.9")
    expect(result).toMatchObject({
      messages: [{ from: "<@U1>" }, { from: "Mime" }],
    })
  })

  test("has no channel parameter for the model to change", () => {
    const tools = slackTools(new SlackClient("x"), "C1", "9.9")
    expect(JSON.stringify(tools.read_thread.inputSchema)).not.toContain(
      "channel",
    )
  })
})

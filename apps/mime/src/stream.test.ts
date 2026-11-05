import { describe, expect, test, vi } from "vitest"
import { SlackClient } from "./slack"
import { SlackReply } from "./stream"

type Call = { method: string; body: Record<string, unknown> }

/** A fake Slack Web API that records calls and fails the methods given. */
function fakeSlack(failing: string[] = []) {
  const calls: Call[] = []
  const fetchFn = vi.fn(async (url: string, init: RequestInit) => {
    const method = url.split("/").pop() as string
    const body =
      typeof init.body === "string"
        ? JSON.parse(init.body)
        : Object.fromEntries(init.body as URLSearchParams)
    calls.push({ method, body })
    if (failing.includes(method))
      return Response.json({ ok: false, error: "not_supported" })
    return Response.json({ ok: true, ts: `${calls.length}.000` })
  })
  return { slack: new SlackClient("xoxb", fetchFn as never), calls }
}

const target = { channel: "C1", threadTs: "1.000", user: "U1", team: "T1" }

describe("SlackReply", () => {
  test("streams text and finishes with blocks", async () => {
    const { slack, calls } = fakeSlack()
    let now = 0
    const reply = new SlackReply(slack, target, () => now)
    await reply.status("Sjekker programmet…")
    await reply.write("To ")
    now = 1000
    await reply.write("arrangementer.")
    const ts = await reply.finish({ blocks: [{ type: "x" }], fallback: [] })
    expect(calls.map(call => call.method)).toEqual([
      "assistant.threads.setStatus",
      "chat.startStream",
      "chat.stopStream",
    ])
    expect(calls[1].body).toMatchObject({
      channel: "C1",
      thread_ts: "1.000",
      recipient_user_id: "U1",
      recipient_team_id: "T1",
      markdown_text: "To arrangementer.",
    })
    expect(calls[2].body.blocks).toEqual([{ type: "x" }])
    expect(ts).toBe("2.000")
  })

  test("falls back to a placeholder message when streaming is refused", async () => {
    const { slack, calls } = fakeSlack([
      "assistant.threads.setStatus",
      "chat.startStream",
    ])
    const reply = new SlackReply(slack, target, () => 0)
    await reply.status("Mime tenker…")
    await reply.write("Svar")
    await reply.flush()
    const ts = await reply.finish({
      blocks: [],
      fallback: [{ type: "markdown", text: "Svar" }],
    })
    const methods = calls.map(call => call.method)
    expect(methods).toContain("chat.postMessage")
    expect(methods.at(-1)).toBe("chat.update")
    expect(calls.at(-1)?.body.blocks).toContain("markdown")
    expect(ts).toBe("2.000")
  })

  test("deletes the placeholder once the stream starts", async () => {
    const { slack, calls } = fakeSlack(["assistant.threads.setStatus"])
    const reply = new SlackReply(slack, target, () => 0)
    await reply.status("Mime tenker…")
    await reply.write("Hei")
    await reply.flush()
    expect(calls.map(call => call.method)).toEqual([
      "assistant.threads.setStatus",
      "chat.postMessage",
      "chat.startStream",
      "chat.delete",
    ])
  })

  test("fail() closes an open stream with the error line", async () => {
    const { slack, calls } = fakeSlack()
    const reply = new SlackReply(slack, target, () => 0)
    await reply.write("Halv")
    await reply.flush()
    await reply.fail("Beklager.")
    expect(calls.map(call => call.method).slice(-2)).toEqual([
      "chat.appendStream",
      "chat.stopStream",
    ])
  })
})

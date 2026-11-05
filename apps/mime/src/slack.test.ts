import { describe, expect, test, vi } from "vitest"
import {
  routeEvent,
  routeInteraction,
  SlackClient,
  type SlackEnvelope,
  SlackSignatureError,
  stripMention,
  threadKey,
  verifySlackRequest,
} from "./slack"

const SECRET = "test-signing-secret"
const NOW = 1_800_000_000

async function signed(body: string, timestamp = NOW, secret = SECRET) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`v0:${timestamp}:${body}`),
  )
  const hex = [...new Uint8Array(mac)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")
  return new Request("https://mime.test/slack/events", {
    method: "POST",
    body,
    headers: {
      "x-slack-request-timestamp": String(timestamp),
      "x-slack-signature": `v0=${hex}`,
    },
  })
}

describe("verifySlackRequest", () => {
  test("returns the body of a correctly signed request", async () => {
    const body = '{"type":"url_verification","challenge":"c"}'
    expect(await verifySlackRequest(await signed(body), SECRET, NOW)).toBe(body)
  })

  test("rejects a request signed with another secret", async () => {
    await expect(
      verifySlackRequest(await signed("{}", NOW, "other"), SECRET, NOW),
    ).rejects.toBeInstanceOf(SlackSignatureError)
  })

  test("rejects a replayed request older than five minutes", async () => {
    await expect(
      verifySlackRequest(await signed("{}", NOW - 301), SECRET, NOW),
    ).rejects.toThrow("Stale request")
  })

  test("rejects a request without signature headers", async () => {
    const request = new Request("https://mime.test", {
      method: "POST",
      body: "{}",
    })
    await expect(
      verifySlackRequest(request, SECRET, NOW),
    ).rejects.toBeInstanceOf(SlackSignatureError)
  })
})

const BOT = "UBOT"
const ALLOWED = new Set(["CNETTSIDE"])

function envelope(
  event: Partial<Extract<SlackEnvelope, { type: "event_callback" }>["event"]>,
): Extract<SlackEnvelope, { type: "event_callback" }> {
  return {
    type: "event_callback",
    event_id: "Ev1",
    authorizations: [{ user_id: BOT, is_bot: true }],
    event: {
      type: "app_mention",
      channel: "CNETTSIDE",
      user: "UMARTIN",
      text: `<@${BOT}> grupper disse tre arrangementene`,
      ts: "1730700000.000200",
      thread_ts: "1730690000.000100",
      ...event,
    },
  }
}

describe("routeEvent", () => {
  test("a mention in a thread reaches that thread's agent without the mention", () => {
    expect(routeEvent(envelope({}), ALLOWED)).toEqual({
      eventId: "Ev1",
      channel: "CNETTSIDE",
      threadTs: "1730690000.000100",
      ts: "1730700000.000200",
      user: "UMARTIN",
      text: "grupper disse tre arrangementene",
      mentioned: true,
    })
  })

  test("a top-level mention starts a thread on its own message", () => {
    const input = routeEvent(envelope({ thread_ts: undefined }), ALLOWED)
    expect(input?.threadTs).toBe("1730700000.000200")
  })

  test("ignores other channels, bots, Mime itself and edits", () => {
    expect(routeEvent(envelope({ channel: "COTHER" }), ALLOWED)).toBeNull()
    expect(routeEvent(envelope({ bot_id: "B1" }), ALLOWED)).toBeNull()
    expect(routeEvent(envelope({ user: BOT }), ALLOWED)).toBeNull()
    expect(
      routeEvent(envelope({ subtype: "message_changed" }), ALLOWED),
    ).toBeNull()
  })

  test("an untagged thread reply is ignored", () => {
    const input = routeEvent(
      envelope({ type: "message", text: "bare de to første" }),
      ALLOWED,
    )
    expect(input).toBeNull()
  })

  test("the message copy of a mention is dropped; app_mention covers it", () => {
    expect(routeEvent(envelope({ type: "message" }), ALLOWED)).toBeNull()
  })

  test("untagged top-level channel messages are ignored", () => {
    expect(
      routeEvent(
        envelope({ type: "message", text: "hei", thread_ts: undefined }),
        ALLOWED,
      ),
    ).toBeNull()
  })
})

test("threadKey and stripMention", () => {
  expect(threadKey({ channel: "C", ts: "2", thread_ts: "1" })).toBe("C:1")
  expect(threadKey({ channel: "C", ts: "2" })).toBe("C:2")
  expect(stripMention("<@UBOT>  hei", "UBOT")).toBe("hei")
})

test("SlackClient form-encodes calls and surfaces Slack errors", async () => {
  const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const body = new URLSearchParams(String(init?.body))
    return Response.json(
      body.get("channel") === "CBAD"
        ? { ok: false, error: "channel_not_found" }
        : { ok: true, ts: "9.9" },
    )
  })
  const slack = new SlackClient("xoxb-test", fetcher as typeof fetch)
  expect(await slack.post("C1", "1.1", "hei")).toBe("9.9")
  const [url, init] = fetcher.mock.calls[0]
  expect(String(url)).toBe("https://slack.com/api/chat.postMessage")
  expect(new Headers(init?.headers).get("authorization")).toBe(
    "Bearer xoxb-test",
  )
  expect(new URLSearchParams(String(init?.body)).get("thread_ts")).toBe("1.1")
  await expect(slack.post("CBAD", "1.1", "hei")).rejects.toThrow(
    "channel_not_found",
  )
})

test("SlackClient sends Block Kit blocks as JSON when updating a message", async () => {
  const fetcher = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
    Response.json({ ok: true }),
  )
  const slack = new SlackClient("token", fetcher as typeof fetch)
  const blocks = [
    { type: "header", text: { type: "plain_text", text: "Forslag" } },
  ]
  await slack.update("C1", "9.9", "Forslag", blocks)
  const body = new URLSearchParams(String(fetcher.mock.calls[0][1]?.body))
  expect(JSON.parse(body.get("blocks") ?? "null")).toEqual(blocks)
  expect(body.get("text")).toBe("Forslag")
})

describe("routeInteraction", () => {
  const payload = {
    type: "block_actions",
    user: { id: "U123" },
    channel: { id: "CNETTSIDE" },
    message: { thread_ts: "123.456" },
    actions: [
      {
        action_id: "mime_plan_approve",
        value: "ab12cd34",
        action_ts: "124.567",
      },
    ],
  }
  const body = (value: unknown) =>
    new URLSearchParams({ payload: JSON.stringify(value) }).toString()
  test("binds a click and its retry to the original plan and thread", () => {
    expect(routeInteraction(body(payload), ALLOWED)).toEqual({
      eventId: "action:124.567:U123:mime_plan_approve",
      channel: "CNETTSIDE",
      threadTs: "123.456",
      ts: "124.567",
      user: "U123",
      text: "ja",
      mentioned: false,
      actionPlanId: "ab12cd34",
    })
    expect(routeInteraction(body(payload), ALLOWED)).toEqual(
      routeInteraction(body(payload), ALLOWED),
    )
    expect(
      routeInteraction(
        body({
          ...payload,
          actions: [{ ...payload.actions[0], action_id: "mime_plan_cancel" }],
        }),
        ALLOWED,
      )?.text,
    ).toBe("nei")
  })
  test("rejects malformed, unrelated and disallowed interactions", () => {
    expect(routeInteraction("broken", ALLOWED)).toBeNull()
    expect(
      routeInteraction(
        body({ ...payload, channel: { id: "COTHER" } }),
        ALLOWED,
      ),
    ).toBeNull()
    expect(
      routeInteraction(body({ ...payload, message: {} }), ALLOWED),
    ).toBeNull()
    expect(
      routeInteraction(
        body({
          ...payload,
          actions: [{ ...payload.actions[0], value: "bad" }],
        }),
        ALLOWED,
      ),
    ).toBeNull()
    expect(
      routeInteraction(
        body({
          ...payload,
          actions: [{ ...payload.actions[0], action_id: "other" }],
        }),
        ALLOWED,
      ),
    ).toBeNull()
  })
})

describe("feedback clicks", () => {
  const body = (action: Record<string, unknown>, extra = {}) =>
    new URLSearchParams({
      payload: JSON.stringify({
        type: "block_actions",
        user: { id: "U1", team_id: "T1" },
        team: { id: "T1" },
        channel: { id: "C1" },
        message: { ts: "2.000", thread_ts: "1.000" },
        actions: [{ action_ts: "3.000", ...action }],
        ...extra,
      }),
    }).toString()

  test("routes a rating to its thread", () => {
    expect(
      routeInteraction(
        body({ action_id: "mime_feedback", value: "negative:ab12cd34" }),
        new Set(["C1"]),
      ),
    ).toMatchObject({
      channel: "C1",
      threadTs: "1.000",
      user: "U1",
      team: "T1",
      mentioned: false,
      feedback: { rating: "negative", turnId: "ab12cd34", messageTs: "2.000" },
    })
  })

  test("drops malformed values and other channels", () => {
    expect(
      routeInteraction(
        body({ action_id: "mime_feedback", value: "meh:ab12cd34" }),
        new Set(["C1"]),
      ),
    ).toBeNull()
    expect(
      routeInteraction(
        body({ action_id: "mime_feedback", value: "positive:ab12cd34" }),
        new Set(["C2"]),
      ),
    ).toBeNull()
  })
})

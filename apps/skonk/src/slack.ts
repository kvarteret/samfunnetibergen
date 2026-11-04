// Slack Web API and Events API plumbing. Kept free of the Agents SDK so the
// request handling can be unit tested in Node.

const SLACK_API = "https://slack.com/api"
// Slack signs every request; anything older is treated as a replay.
const MAX_SKEW_SECONDS = 5 * 60

export class SlackSignatureError extends Error {}

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Checks Slack's `v0` HMAC-SHA256 signature over `v0:<timestamp>:<body>` and
 * returns the raw body. https://api.slack.com/authentication/verifying-requests-from-slack
 */
export async function verifySlackRequest(
  request: Request,
  signingSecret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? ""
  const signature = request.headers.get("x-slack-signature") ?? ""
  const body = await request.text()
  const sent = Number(timestamp)
  if (!signingSecret || !Number.isInteger(sent))
    throw new SlackSignatureError("Missing signature")
  if (Math.abs(nowSeconds - sent) > MAX_SKEW_SECONDS)
    throw new SlackSignatureError("Stale request")
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`v0:${timestamp}:${body}`),
  )
  if (!constantTimeEqual(`v0=${hex(mac)}`, signature))
    throw new SlackSignatureError("Bad signature")
  return body
}

export type SlackMessageEvent = {
  type: "app_mention" | "message"
  subtype?: string
  channel: string
  user?: string
  bot_id?: string
  text?: string
  ts: string
  thread_ts?: string
}

export type SlackEnvelope =
  | { type: "url_verification"; challenge: string }
  | {
      type: "event_callback"
      event_id: string
      event: SlackMessageEvent
      authorizations?: { user_id?: string; is_bot?: boolean }[]
    }

/** What the Worker hands to a thread's agent. */
export type ThreadInput = {
  eventId: string
  channel: string
  threadTs: string
  ts: string
  user: string
  text: string
  /** True when the message tagged Skonk; untagged messages only count once Skonk joined the thread. */
  mentioned: boolean
}

/** A thread is identified by its root message; a top-level mention starts one. */
export function threadKey(event: {
  channel: string
  ts: string
  thread_ts?: string
}) {
  return `${event.channel}:${event.thread_ts ?? event.ts}`
}

export function stripMention(text: string, botUserId?: string) {
  const mention = botUserId ? `<@${botUserId}>` : /<@[A-Z0-9]+>/
  return text.replace(mention, "").trim()
}

/**
 * Decides whether an event reaches an agent. Mentions are delivered twice by
 * Slack (`app_mention` and `message`); only `app_mention` counts for those.
 * Untagged messages are forwarded only inside threads, and the agent ignores
 * them unless it already joined that thread.
 */
export function routeEvent(
  envelope: Extract<SlackEnvelope, { type: "event_callback" }>,
  allowedChannels: ReadonlySet<string>,
): ThreadInput | null {
  const { event } = envelope
  const botUserId = envelope.authorizations?.find(a => a.is_bot)?.user_id
  if (!allowedChannels.has(event.channel)) return null
  if (event.bot_id || !event.user || event.user === botUserId) return null
  if (event.subtype) return null // edits, joins, file shares, bot posts
  const text = event.text ?? ""
  const mentioned = event.type === "app_mention"
  if (!mentioned) {
    if (!event.thread_ts) return null
    if (botUserId && text.includes(`<@${botUserId}>`)) return null
  }
  return {
    eventId: envelope.event_id,
    channel: event.channel,
    threadTs: event.thread_ts ?? event.ts,
    ts: event.ts,
    user: event.user,
    text: stripMention(text, botUserId),
    mentioned,
  }
}

type SlackResponse = { ok: boolean; error?: string; ts?: string }

export class SlackClient {
  constructor(
    private token: string,
    // Wrapped: workerd rejects `fetch` called with another `this`.
    private fetcher: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  private async call<T extends SlackResponse>(
    method: string,
    body: Record<string, string | number | boolean>,
  ): Promise<T> {
    // Form encoding works for every Web API method; JSON bodies do not work
    // for read methods such as conversations.replies.
    const form = new URLSearchParams(
      Object.entries(body).map(([key, value]) => [key, String(value)]),
    )
    const response = await this.fetcher(`${SLACK_API}/${method}`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}` },
      body: form,
    })
    const json = (await response.json()) as T
    if (!json.ok) throw new Error(`Slack ${method} failed: ${json.error}`)
    return json
  }

  async post(channel: string, threadTs: string, text: string) {
    const { ts } = await this.call("chat.postMessage", {
      channel,
      thread_ts: threadTs,
      text,
      unfurl_links: false,
      unfurl_media: false,
    })
    if (!ts) throw new Error("Slack chat.postMessage returned no ts")
    return ts
  }

  async update(channel: string, ts: string, text: string) {
    await this.call("chat.update", { channel, ts, text })
  }

  /** Earlier messages in the thread, oldest first, for the first turn's context. */
  async replies(channel: string, threadTs: string, limit = 50) {
    const json = await this.call<
      SlackResponse & {
        messages?: {
          user?: string
          bot_id?: string
          username?: string
          text?: string
          ts: string
        }[]
      }
    >("conversations.replies", { channel, ts: threadTs, limit })
    return json.messages ?? []
  }
}

/** Slack caps message text at 40,000 characters; keep well inside it. */
export function slackText(text: string, max = 3900) {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

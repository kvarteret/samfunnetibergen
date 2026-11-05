// One reply in a Slack thread, streamed as the model writes it. If Slack
// refuses streaming or status in this kind of channel, the reply falls back to
// a placeholder message that is edited once the answer is ready.

import type { SlackClient } from "./slack"
import { slackText } from "./slack"

// chat.startStream/appendStream are rate limited (Tier 2/4), so text is sent in
// batches rather than per token.
const FLUSH_MS = 900
const FLUSH_CHARS = 600
// Slack caps a streamed message at 12,000 characters of markdown_text.
const STREAM_LIMIT = 11_500

export type ReplyTarget = {
  channel: string
  threadTs: string
  /** The person being answered; required by Slack when streaming in channels. */
  user: string
  team?: string
}

export class SlackReply {
  #mode: "idle" | "stream" | "message" = "idle"
  #ts?: string
  #placeholder?: string
  #statusWorks = true
  #buffer = ""
  #streamed = 0
  #lastFlush = 0
  #text = ""

  constructor(
    private slack: SlackClient,
    private target: ReplyTarget,
    private now: () => number = Date.now,
  ) {}

  /** Everything the model has written so far. */
  get text() {
    return this.#text
  }

  /** Shows what Mime is doing while no answer text is flowing yet. */
  async status(text: string, loadingMessages?: string[]) {
    if (this.#mode === "stream") return
    const { channel, threadTs } = this.target
    if (this.#statusWorks) {
      try {
        await this.slack.setStatus(channel, threadTs, text, loadingMessages)
        return
      } catch {
        // Not supported here (e.g. a normal channel thread): use a placeholder.
        this.#statusWorks = false
      }
    }
    const line = `_${text}_`
    if (this.#placeholder)
      await this.slack
        .update(channel, this.#placeholder, line)
        .catch(() => undefined)
    else
      this.#placeholder = await this.slack
        .post(channel, threadTs, line)
        .catch(() => undefined)
  }

  async write(delta: string) {
    this.#text += delta
    this.#buffer += delta
    if (
      this.now() - this.#lastFlush >= FLUSH_MS ||
      this.#buffer.length >= FLUSH_CHARS
    )
      await this.flush()
  }

  async flush() {
    if (!this.#buffer || this.#mode === "message") return
    const room = STREAM_LIMIT - this.#streamed
    if (room <= 0) return
    const chunk = this.#buffer.slice(0, room)
    const { channel, threadTs, user, team } = this.target
    try {
      if (this.#mode === "idle") {
        this.#ts = await this.slack.startStream({
          channel,
          threadTs,
          markdown: chunk,
          recipientUserId: user,
          recipientTeamId: team,
        })
        this.#mode = "stream"
        await this.clearPlaceholder()
      } else {
        // biome-ignore lint/style/noNonNullAssertion: set when streaming
        await this.slack.appendStream(channel, this.#ts!, chunk)
      }
      this.#streamed += chunk.length
      this.#buffer = this.#buffer.slice(chunk.length)
    } catch {
      // Streaming is not available (or the stream timed out): finish as a
      // normal message instead. What was already streamed stays visible.
      this.#mode = "message"
    }
    this.#lastFlush = this.now()
  }

  private async clearPlaceholder() {
    if (!this.#placeholder) return
    const { channel } = this.target
    const ts = this.#placeholder
    this.#placeholder = undefined
    await this.slack.delete(channel, ts).catch(() => undefined)
  }

  /**
   * Finishes the reply with `blocks` (links, feedback buttons) at the bottom.
   * `fallback` is the full answer as Block Kit, used when not streaming.
   * Returns the ts of the message that holds the answer.
   */
  async finish(options: {
    blocks: unknown[]
    fallback: unknown[]
    text?: string
  }): Promise<string> {
    const text = options.text ?? this.#text
    const { channel, threadTs } = this.target
    if (this.#mode === "idle" && text) await this.flush()
    if (this.#mode === "stream" && this.#ts) {
      await this.flush()
      const complete = this.#streamed >= text.length && !this.#buffer
      try {
        await this.slack.stopStream(
          channel,
          this.#ts,
          complete ? options.blocks : [],
        )
        if (complete) return this.#ts
      } catch {
        // The stream is gone (e.g. past Slack's ten minutes): post the answer.
      }
    }
    if (this.#statusWorks)
      await this.slack.setStatus(channel, threadTs, "").catch(() => undefined)
    const plain = slackText(text || " ", 36000)
    if (this.#placeholder) {
      const ts = this.#placeholder
      await this.slack.update(channel, ts, plain, options.fallback)
      return ts
    }
    return this.slack.post(channel, threadTs, plain, options.fallback)
  }

  /** Ends the turn with an error line, wherever the reply got to. */
  async fail(message: string) {
    const { channel, threadTs } = this.target
    if (this.#mode === "stream" && this.#ts) {
      await this.slack
        .appendStream(channel, this.#ts, `\n\n${message}`)
        .catch(() => undefined)
      await this.slack.stopStream(channel, this.#ts).catch(() => undefined)
      return
    }
    if (this.#statusWorks)
      await this.slack.setStatus(channel, threadTs, "").catch(() => undefined)
    if (this.#placeholder)
      await this.slack
        .update(channel, this.#placeholder, message)
        .catch(() => undefined)
    else
      await this.slack.post(channel, threadTs, message).catch(() => undefined)
  }
}

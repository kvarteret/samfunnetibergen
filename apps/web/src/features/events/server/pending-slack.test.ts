import type { SanityClient } from "@sanity/client"
import { afterEach, describe, expect, test, vi } from "vitest"
import {
  notifyPendingRequest,
  pendingMessage,
  previewPendingRequests,
} from "./pending-slack"

const event = {
  _id: "drafts.event-1",
  localizedTitle: [{ language: "nb", value: "<!channel> Concert" }],
  submittedBy: "Skonk",
  dates: [{ startDate: "2026-10-16", startTime: "21:00", endTime: "01:00" }],
}
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("pending Slack notifications", () => {
  test("renders untrusted title as plain text and links to Studio", () => {
    const message = pendingMessage(event)
    expect(message.blocks[0]).toMatchObject({ text: { type: "plain_text" } })
    expect(JSON.stringify(message.blocks[1])).toContain(
      "https://studio.samfunnetibergen.no/intent/edit/id=event-1;type=arrangement/",
    )
  })
  test("warns reviewers about automatically imported events with their ticket source", () => {
    const ticketUrl = "https://kvarteret.ticketco.events/no/nb/e/concert"
    const message = pendingMessage({
      ...event,
      _id: "drafts.ticketco-test",
      ticketUrl,
    })
    const warning = `Dette arrangementet var automatisk generert fra ${ticketUrl}. Se nøye gjennom!`
    expect(message.text).toContain(warning)
    expect(JSON.stringify(message.blocks)).toContain(warning)
    expect(pendingMessage({ ...event, ticketUrl }).text).not.toContain(
      "automatisk generert",
    )
  })
  test("skips previously delivered requests", async () => {
    vi.stubEnv(
      "SLACK_NETTSIDE_WEBHOOK",
      "https://hooks.slack.com/services/test",
    )
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    const client = {
      createIfNotExists: vi.fn(),
      getDocument: vi.fn(async () => ({ deliveredAt: "2026-10-06" })),
    } as unknown as SanityClient
    expect(await notifyPendingRequest(client, event)).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })
  test("skips requests another sender has claimed", async () => {
    vi.stubEnv(
      "SLACK_NETTSIDE_WEBHOOK",
      "https://hooks.slack.com/services/test",
    )
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    const client = {
      createIfNotExists: vi.fn(),
      getDocument: vi.fn(async () => ({ claimedAt: "2026-10-06" })),
    } as unknown as SanityClient
    expect(await notifyPendingRequest(client, event)).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })
  test("rejected delivery releases its claim for retry and successful delivery records receipt", async () => {
    vi.stubEnv(
      "SLACK_NETTSIDE_WEBHOOK",
      "https://hooks.slack.com/services/test",
    )
    const patch = {
      ifRevisionId: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      unset: vi.fn().mockReturnThis(),
      commit: vi.fn(async () => ({ _rev: "claim-rev" })),
    }
    const client = {
      createIfNotExists: vi.fn(),
      getDocument: vi.fn(async () => ({ _rev: "rev" })),
      patch: vi.fn(() => patch),
    } as unknown as SanityClient
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("failed", { status: 500 })),
    )
    expect(await notifyPendingRequest(client, event)).toBe(false)
    expect(patch.set).toHaveBeenCalledWith({ claimedAt: expect.any(String) })
    expect(patch.unset).toHaveBeenCalledWith(["claimedAt"])
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("ok")),
    )
    expect(await notifyPendingRequest(client, event)).toBe(true)
    expect(patch.set).toHaveBeenCalledWith({ deliveredAt: expect.any(String) })
  })
  test("keeps its claim when the delivery outcome is unknown", async () => {
    vi.stubEnv(
      "SLACK_NETTSIDE_WEBHOOK",
      "https://hooks.slack.com/services/test",
    )
    const patch = {
      ifRevisionId: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      unset: vi.fn().mockReturnThis(),
      commit: vi.fn(async () => ({ _rev: "claim-rev" })),
    }
    const client = {
      createIfNotExists: vi.fn(),
      getDocument: vi.fn(async () => ({ _rev: "rev" })),
      patch: vi.fn(() => patch),
    } as unknown as SanityClient
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("timed out", "TimeoutError")
      }),
    )
    expect(await notifyPendingRequest(client, event)).toBe(false)
    expect(patch.unset).not.toHaveBeenCalled()
  })
  test("previews without claiming, writing or posting", async () => {
    vi.stubEnv(
      "SLACK_NETTSIDE_WEBHOOK",
      "https://hooks.slack.com/services/test",
    )
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    const client = {
      fetch: vi.fn(async () => [
        event,
        { ...event, _id: "event-1" },
        { ...event, _id: "drafts.event-2" },
      ]),
      getDocument: vi
        .fn()
        .mockResolvedValueOnce({ deliveredAt: "2026-10-13T00:00:00Z" })
        .mockResolvedValueOnce(null),
      createIfNotExists: vi.fn(),
      patch: vi.fn(),
    } as unknown as SanityClient
    expect(await previewPendingRequests(client)).toEqual({
      wouldSend: 1,
      alreadyAnnounced: 1,
    })
    expect(client.createIfNotExists).not.toHaveBeenCalled()
    expect(client.patch).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })
})

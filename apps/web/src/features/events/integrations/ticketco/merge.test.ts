import type { SanityClient } from "@sanity/client"
import { describe, expect, test, vi } from "vitest"
import { mergeDuplicateListing } from "./merge"

const listing = {
  url: "https://teater.ticketco.events/no/nb/e/show5",
  title: "Hvor er Tassi?!?!",
  imageAssetId: "image-new-848x1200-png",
  date: { startDate: "2099-10-24", startTime: "19:30", endTime: "21:00" },
}
const existing = {
  _rev: "r1",
  _createdAt: "2099-10-01T00:00:00Z",
  title: "Hvor er  Tassi?!?! ",
  dates: [
    {
      _key: "a",
      _type: "arrangementDate",
      startDate: "2099-10-24",
      startTime: "16:30",
    },
  ],
}

function fixture(thumbHash: string | null, candidates: object[]) {
  const patches: { id: string; ops: Record<string, unknown> }[] = []
  const transaction = {
    patch: vi.fn((id: string, build: (patch: unknown) => unknown) => {
      const ops: Record<string, unknown> = {}
      const record = (key: string) => (value: unknown) => {
        ops[key] = value
        return patch
      }
      const patch = {
        ifRevisionId: record("rev"),
        set: record("set"),
        setIfMissing: record("setIfMissing"),
        append: (path: string, items: unknown[]) =>
          record("append")([path, items]),
      }
      build(patch)
      patches.push({ id, ops })
      return transaction
    }),
    commit: vi.fn(async () => ({})),
  }
  const client = {
    fetch: vi.fn(async (query: string) =>
      query.includes("$asset") ? thumbHash : candidates,
    ),
    transaction: () => transaction,
    delete: vi.fn(async () => ({})),
  }
  return { client: client as unknown as SanityClient, patches, transaction }
}

describe("mergeDuplicateListing", () => {
  test("adds the performance as a sorted date on both published and draft", async () => {
    const { client, patches } = fixture("hash", [
      { ...existing, _id: "ticketco-a" },
      { ...existing, _id: "drafts.ticketco-a", _rev: "r2" },
    ])
    expect(await mergeDuplicateListing(client, listing)).toBe("ticketco-a")
    expect(patches.map(patch => patch.id)).toEqual([
      "ticketco-a",
      "drafts.ticketco-a",
    ])
    const dates = (patches[0].ops.set as { dates: { startTime: string }[] })
      .dates
    expect(dates.map(date => date.startTime)).toEqual(["16:30", "19:30"])
    expect(patches[1].ops.rev).toBe("r2")
    expect(patches[0].ops.append).toEqual(["sourceTicketUrls", [listing.url]])
    expect(client.delete).toHaveBeenCalledWith(listing.imageAssetId)
  })

  test("leaves different titles, distant runs and hashless images alone", async () => {
    for (const { hash, candidate } of [
      { hash: "hash", candidate: { ...existing, title: "Annen forestilling" } },
      {
        hash: "hash",
        candidate: {
          ...existing,
          dates: [{ ...existing.dates[0], startDate: "2099-03-01" }],
        },
      },
      { hash: null, candidate: existing },
    ]) {
      const { client, transaction } = fixture(hash, [
        { ...candidate, _id: "ticketco-a" },
      ])
      expect(await mergeDuplicateListing(client, listing)).toBeNull()
      expect(transaction.commit).not.toHaveBeenCalled()
    }
  })

  test("merges into the oldest arrangement when several match", async () => {
    const { client, patches } = fixture("hash", [
      { ...existing, _id: "newer", _createdAt: "2099-10-05T00:00:00Z" },
      { ...existing, _id: "older" },
    ])
    expect(await mergeDuplicateListing(client, listing)).toBe("older")
    expect(patches.map(patch => patch.id)).toEqual(["older"])
  })
})

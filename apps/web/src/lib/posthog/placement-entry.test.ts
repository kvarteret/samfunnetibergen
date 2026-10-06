import { expect, it } from "vitest"

import { entrySurface, rememberEntrySurface } from "./placement-entry"

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  } as unknown as Storage
}

it("remembers where a visitor clicked an event from, for half an hour", () => {
  const storage = memoryStorage()
  rememberEntrySurface(["doc1", "the-snooks"], "home-upcoming", 0, storage)
  expect(entrySurface(["doc1"], 60_000, storage)).toBe("home-upcoming")
  expect(entrySurface([null, "the-snooks"], 60_000, storage)).toBe(
    "home-upcoming",
  )
  expect(entrySurface(["doc1"], 31 * 60_000, storage)).toBeUndefined()
  expect(entrySurface(["other"], 60_000, storage)).toBeUndefined()
})

it("keeps the latest surface and tolerates missing or broken storage", () => {
  const storage = memoryStorage()
  rememberEntrySurface(["doc1"], "calendar", 0, storage)
  rememberEntrySurface(["doc1"], "home-promoted", 1000, storage)
  expect(entrySurface(["doc1"], 2000, storage)).toBe("home-promoted")
  storage.setItem("event-placement-entries", "not json")
  expect(entrySurface(["doc1"], 2000, storage)).toBeUndefined()
  expect(() =>
    rememberEntrySurface(["doc1"], "calendar", 0, undefined),
  ).not.toThrow()
})

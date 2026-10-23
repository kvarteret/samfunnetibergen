import { expect, it } from "vitest"

it("installs toSorted when missing without mutating the source", async () => {
  const original = Array.prototype.toSorted
  // @ts-expect-error simulate an old browser
  delete Array.prototype.toSorted
  await import("./polyfills")
  const input = [3, 1, 2]
  expect(input.toSorted((a, b) => a - b)).toEqual([1, 2, 3])
  expect(input).toEqual([3, 1, 2])
  Array.prototype.toSorted = original
})

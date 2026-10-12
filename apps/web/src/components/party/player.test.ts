import { afterEach, describe, expect, it, vi } from "vitest"
import { playerFromSearch } from "./player"

afterEach(() => vi.restoreAllMocks())
describe("named player links", () => {
  it("requires a nonempty name", () => {
    expect(playerFromSearch("")).toBeNull()
    expect(playerFromSearch("?player=+%00")).toBeNull()
  })
  it("decodes and bounds the internal name, independently of animal assignment", () => {
    vi.spyOn(Math, "random").mockReturnValue(0)
    expect(playerFromSearch("?player=%20%C3%85se%20")).toEqual({
      name: "Åse",
      mascot: "pingvin",
    })
    vi.spyOn(Math, "random").mockReturnValue(0.99)
    expect(playerFromSearch("?player=%C3%85se")).toEqual({
      name: "Åse",
      mascot: "pinnsvin",
    })
    expect(playerFromSearch(`?player=${"a".repeat(100)}`)?.name).toHaveLength(
      32,
    )
  })
})

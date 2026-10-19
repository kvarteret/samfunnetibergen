import { describe, expect, it } from "vitest"

import {
  isAllowedOrigin,
  type PlayerState,
  parseClientMessage,
  parseScreenClientMessage,
  parseScreenServerMessage,
  parseServerMessage,
  roomForPath,
} from "./protocol"

const state: PlayerState = {
  mascot: "pingvin",
  ref: 12,
  fx: 0.4,
  dy: -30,
  facing: 1,
  pose: "air",
  growth: 1,
}

describe("parseClientMessage", () => {
  it("accepts a move", () => {
    expect(parseClientMessage(JSON.stringify({ type: "move", state }))).toEqual(
      { type: "move", state },
    )
  })

  it("accepts a rest", () => {
    expect(parseClientMessage('{"type":"rest"}')).toEqual({ type: "rest" })
  })

  it("drops unknown fields from the state", () => {
    const message = JSON.stringify({
      type: "move",
      state: { ...state, html: "<script>" },
    })
    expect(parseClientMessage(message)).toEqual({ type: "move", state })
  })

  it.each([
    ["an unknown mascot", { ...state, mascot: "elg" }],
    ["a fractional reference", { ...state, ref: 1.5 }],
    ["an infinite height", { ...state, dy: Number.POSITIVE_INFINITY }],
    ["a sideways facing", { ...state, facing: 0 }],
    ["a giant", { ...state, growth: 40 }],
  ])("rejects %s", (_, bad) => {
    const message = parseClientMessage(
      JSON.stringify({ type: "move", state: bad }),
    )
    expect(message).toBeNull()
  })

  it("rejects oversized and malformed frames", () => {
    expect(parseClientMessage("x".repeat(600))).toBeNull()
    expect(parseClientMessage("{")).toBeNull()
    expect(parseClientMessage(new ArrayBuffer(8))).toBeNull()
  })
})

describe("parseServerMessage", () => {
  it("keeps the valid players of a welcome", () => {
    const message = JSON.stringify({
      type: "welcome",
      players: [
        { id: "a", state },
        { id: "b", state: { ...state, pose: "dance" } },
        { id: "", state },
      ],
    })
    expect(parseServerMessage(message)).toEqual({
      type: "welcome",
      players: [{ id: "a", state }],
    })
  })

  it("parses moves and leaves", () => {
    expect(
      parseServerMessage(JSON.stringify({ type: "move", id: "a", state })),
    ).toEqual({ type: "move", id: "a", state })
    expect(
      parseServerMessage(JSON.stringify({ type: "leave", id: "a" })),
    ).toEqual({ type: "leave", id: "a" })
    expect(parseServerMessage(JSON.stringify({ type: "boo" }))).toBeNull()
  })
})

describe("roomForPath", () => {
  it("turns a pathname into a slug", () => {
    expect(roomForPath("/")).toBe("forside")
    expect(roomForPath("/en/arrangementer/Quiz%20Night")).toBe(
      "en-arrangementer-quiz-20night",
    )
    expect(roomForPath("///")).toBe("forside")
    expect(roomForPath(`/a${"-".repeat(200)}/`)).toBe("a")
    expect(roomForPath(`/${"b".repeat(95)}/c`)).toBe("b".repeat(95))
  })
})

describe("isAllowedOrigin", () => {
  const allowed = "https://www.samfunnetibergen.no, *.example.dev"

  it("allows listed origins and https subdomains of a wildcard", () => {
    expect(isAllowedOrigin("https://www.samfunnetibergen.no", allowed)).toBe(
      true,
    )
    expect(isAllowedOrigin("https://preview.example.dev", allowed)).toBe(true)
  })

  it("refuses everything else", () => {
    expect(isAllowedOrigin(null, allowed)).toBe(false)
    expect(isAllowedOrigin("https://evil.no", allowed)).toBe(false)
    expect(isAllowedOrigin("http://preview.example.dev", allowed)).toBe(false)
    expect(isAllowedOrigin("https://example.dev.evil.no", allowed)).toBe(false)
    expect(isAllowedOrigin("not a url", allowed)).toBe(false)
  })
})

describe("central infoskjerm messages", () => {
  it("accepts named joins and screen watchers, but rejects missing or oversized names", () => {
    expect(
      parseScreenClientMessage(
        JSON.stringify({ type: "join", name: "Anna", mascot: "pingvin" }),
      ),
    ).toEqual({ type: "join", name: "Anna", mascot: "pingvin" })
    expect(
      parseScreenClientMessage(
        JSON.stringify({
          type: "join",
          name: "Anna",
          mascot: "pingvin",
          game: "subwaysurfers",
        }),
      ),
    ).toEqual({
      type: "join",
      name: "Anna",
      mascot: "pingvin",
      game: "subwaysurfers",
    })
    expect(
      parseScreenClientMessage(
        JSON.stringify({
          type: "join",
          name: "Anna",
          mascot: "pingvin",
          game: "nope",
        }),
      ),
    ).toBeNull()
    expect(parseScreenClientMessage('{"type":"screen"}')).toEqual({
      type: "screen",
    })
    for (const name of [undefined, "", "a".repeat(33), "a\nb"])
      expect(
        parseScreenClientMessage(
          JSON.stringify({ type: "join", name, mascot: "pingvin" }),
        ),
      ).toBeNull()
  })
  it("validates simultaneous input and action counters", () => {
    const input = { left: false, right: true, heldJump: true, jump: 2, drop: 0 }
    expect(
      parseScreenClientMessage(JSON.stringify({ type: "input", input })),
    ).toEqual({ type: "input", input })
    for (const bad of [
      { ...input, left: 1 },
      { ...input, jump: -1 },
      { ...input, drop: 1.2 },
    ])
      expect(
        parseScreenClientMessage(JSON.stringify({ type: "input", input: bad })),
      ).toBeNull()
    // Position updates cannot control the central display.
    expect(
      parseScreenClientMessage(JSON.stringify({ type: "move", state })),
    ).toBeNull()
  })
  it("supports repeated animals as separate players without broadcasting names", () => {
    const input = {
      left: false,
      right: false,
      heldJump: false,
      jump: 0,
      drop: 0,
    }
    const players = [
      { id: "a", mascot: "pingvin", name: "Anna", input },
      { id: "b", mascot: "pingvin", name: "Anna", input },
    ]
    expect(
      parseScreenServerMessage(JSON.stringify({ type: "players", players })),
    ).toEqual({
      type: "players",
      players: players.map(({ name: _name, ...player }) => player),
    })
    expect(
      parseScreenServerMessage('{"type":"screen-status","available":true}'),
    ).toEqual({ type: "screen-status", available: true })
  })
})

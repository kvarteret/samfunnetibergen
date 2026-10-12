import { describe, expect, it } from "vitest"

import {
  isAllowedOrigin,
  type PlayerState,
  parseClientMessage,
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

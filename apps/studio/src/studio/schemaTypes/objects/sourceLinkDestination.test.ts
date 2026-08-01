import { describe, expect, it } from "vitest"

import {
  buildDestinationPatches,
  getDestinationValue,
  parseDestinationInput,
} from "./sourceLinkDestination"

describe("source link destinations", () => {
  it.each([
    ["/nb/rom", { kind: "internalPath", href: "/nb/rom" }],
    ["https://example.com", { kind: "external", href: "https://example.com" }],
    [
      "mailto:test@example.com",
      { kind: "external", href: "mailto:test@example.com" },
    ],
    ["tel:+4755555555", { kind: "external", href: "tel:+4755555555" }],
  ])("parses %s", (input, expected) => {
    expect(parseDestinationInput(input)).toEqual(expected)
  })

  it("rejects unsupported and relative values", () => {
    expect(parseDestinationInput("example.com")).toBeNull()
    expect(parseDestinationInput("//example.com")).toBeNull()
  })

  it("sets one destination and unsets all competitors", () => {
    expect(
      buildDestinationPatches({
        kind: "internalDocument",
        documentId: "room-1",
      }),
    ).toEqual([
      { type: "set", path: "linkType", value: "internalPage" },
      {
        type: "set",
        path: "internalPage",
        value: { _type: "reference", _ref: "room-1" },
      },
      { type: "unset", path: "internalPath" },
      { type: "unset", path: "externalUrl" },
    ])
  })

  it("sets internal paths and external URLs", () => {
    expect(
      buildDestinationPatches({ kind: "internalPath", href: "/nb" }),
    ).toContainEqual({
      type: "set",
      path: "internalPath",
      value: "/nb",
    })
    expect(
      buildDestinationPatches({
        kind: "external",
        href: "https://example.com",
      }),
    ).toContainEqual({
      type: "set",
      path: "externalUrl",
      value: "https://example.com",
    })
  })

  it("clears every stored destination field", () => {
    expect(buildDestinationPatches(null)).toHaveLength(4)
    expect(
      buildDestinationPatches(null).every(patch => patch.type === "unset"),
    ).toBe(true)
  })

  it("formats stored destinations for the input", () => {
    expect(
      getDestinationValue({
        linkType: "internalPage",
        internalPage: { _type: "reference", _ref: "page-1" },
      }),
    ).toBe("document:page-1")
    expect(
      getDestinationValue({
        linkType: "internalPath",
        internalPath: "/nb",
      }),
    ).toBe("/nb")
    expect(
      getDestinationValue({
        linkType: "external",
        externalUrl: "https://example.com",
      }),
    ).toBe("https://example.com")
    expect(getDestinationValue(undefined)).toBe("")
  })
})

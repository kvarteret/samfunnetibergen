import { describe, expect, test } from "vitest"
import { relevantLinks, responseBlocks } from "./response"

describe("relevant links", () => {
  test("collects labeled Slack, Markdown and plain URLs without duplicates", () => {
    const links = relevantLinks(
      "Se <https://studio.example.no/doc|Arrangement i Studio> og [billetter](https://tickets.example/e). Kilde: https://tickets.example/e. <https://studio.example.no/doc|Igjen>",
    )
    expect(links).toEqual([
      { url: "https://studio.example.no/doc", label: "Arrangement i Studio" },
      { url: "https://tickets.example/e", label: "billetter" },
    ])
  })
  test("ignores code, unsafe destinations and malformed addresses", () => {
    const links = relevantLinks(
      "`https://example.com/code` ```https://example.com/hidden``` <https://user:pass@example.com|private> http://example.com <https://[bad|x>",
    )
    expect(links).toEqual([])
  })
  test("preserves query strings and escapes Slack formatting", () => {
    const links = responseBlocks(
      "<https://example.com/?a=1&amp;b=2|Billetter & info>",
    )
    expect(JSON.stringify(links)).toContain(
      "<https://example.com/?a=1&amp;b=2|Billetter &amp; info>",
    )
  })
  test("handles many links and long replies within Slack limits", () => {
    const answer = `${"Melding ".repeat(1800)}\n${Array.from({ length: 40 }, (_, i) => `<https://example.com/${i}|Lenke ${i}>`).join("\n")}`
    const blocks = responseBlocks(answer)
    expect(blocks.length).toBeLessThanOrEqual(45)
    for (const block of blocks)
      if (block.type === "section")
        expect(block.text.text.length).toBeLessThanOrEqual(3000)
      else expect(block.text.length).toBeLessThanOrEqual(12000)
    expect(
      blocks.some(
        block =>
          block.type === "section" &&
          block.text.text.includes("Nyttige lenker"),
      ),
    ).toBe(true)
    expect(JSON.stringify(blocks)).toContain("https://example.com/0")
  })
  test("does not append a links section when there are no links", () => {
    expect(responseBlocks("Hei!")).toEqual([{ type: "markdown", text: "Hei!" }])
  })
})

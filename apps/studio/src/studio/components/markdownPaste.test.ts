import { describe, expect, it } from "vitest"
import { looksLikeMarkdown, markdownToContentBlocks } from "./markdownPaste"

describe("looksLikeMarkdown", () => {
  it("detects common markdown", () => {
    expect(looksLikeMarkdown("# Konsert\n\nMed **Taake**")).toBe(true)
    expect(looksLikeMarkdown("- Dører 20:00\n- Konsert 21:00")).toBe(true)
    expect(looksLikeMarkdown("Se [billetter](https://example.com)")).toBe(true)
  })

  it("leaves ordinary prose alone", () => {
    expect(looksLikeMarkdown("Velkommen til konsert i Teglverket.")).toBe(false)
    expect(looksLikeMarkdown("Pris: 200 kr - student 150 kr")).toBe(false)
  })
})

describe("markdownToContentBlocks", () => {
  it("maps headings onto the editor's h2–h4 styles", () => {
    const blocks = markdownToContentBlocks("# A\n\n## B\n\n#### C")
    expect(blocks.map(block => block.style)).toEqual(["h2", "h3", "h4"])
  })

  it("keeps lists, emphasis and links", () => {
    const blocks = markdownToContentBlocks(
      "- **Dører** 20:00\n- [Billetter](https://example.com)",
    )
    expect(blocks.map(block => block.listItem)).toEqual(["bullet", "bullet"])
    expect(blocks[0]?.children?.[0]).toMatchObject({ marks: ["strong"] })
    expect(blocks[1]?.markDefs).toEqual([
      expect.objectContaining({ _type: "link", href: "https://example.com" }),
    ])
  })

  it("turns unsupported code blocks into plain text", () => {
    const blocks = markdownToContentBlocks("```\nline\n```")
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ _type: "block", style: "normal" })
    expect(blocks[0]?.children?.[0]?.text).toBe("line")
  })
})

import { describe, expect, it } from "vitest"

import { serializePublicDescription } from "./description"

describe("public event descriptions", () => {
  it("renders supported blocks, decorators, links, lists, and images", () => {
    const result = serializePublicDescription([
      {
        _type: "block",
        style: "h2",
        children: [
          { _type: "span", text: "Hello", marks: ["strong"] },
          { _type: "span", text: " world", marks: ["link-1"] },
        ],
        markDefs: [
          { _key: "link-1", _type: "link", href: "/arrangementer/test" },
        ],
      },
      {
        _type: "block",
        style: "normal",
        listItem: "bullet",
        level: 1,
        children: [{ _type: "span", text: "A list item", marks: [] }],
        markDefs: [],
      },
      {
        _type: "image",
        imageUrl: "https://cdn.example.test/image.jpg",
        alt: "A picture",
        caption: "A caption",
      },
    ])

    expect(result.text).toContain("Hello world")
    expect(result.text).toContain("A list item")
    expect(result.html).toContain("<h2><strong>Hello</strong>")
    expect(result.html).toContain('<a href="/arrangementer/test"> world</a>')
    expect(result.html).toContain(
      '<figure><img src="https://cdn.example.test/image.jpg"',
    )
    expect(result.html).toContain("<figcaption>A caption</figcaption>")
    expect(result.html).not.toContain("style=")
  })

  it("escapes markup and removes unsafe links and image URLs", () => {
    const result = serializePublicDescription([
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "<script>alert(1)</script>",
            marks: ["bad-link"],
          },
        ],
        markDefs: [
          {
            _key: "bad-link",
            _type: "link",
            href: "javascript:alert(1)",
          },
        ],
      },
      {
        _type: "image",
        imageUrl: "javascript:alert(1)",
        alt: '<img src=x onerror="alert(1)">',
        caption: "<script>alert(2)</script>",
      },
      {
        _type: "image",
        imageUrl: "data:image/svg+xml,<svg/onload=alert(1)>",
        alt: "not rendered",
      },
    ])

    expect(result.text).toBe("<script>alert(1)</script>")
    expect(result.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(result.html).not.toContain("javascript:")
    expect(result.html).not.toContain("onerror")
    expect(result.html).not.toContain("<script>")
    expect(result.html).not.toContain("data:image")
  })

  it("allows safe absolute, mail, telephone, and internal links", () => {
    const links = [
      ["https://example.test", "https"],
      ["http://example.test", "http"],
      ["mailto:events@example.test", "mail"],
      ["tel:+4712345678", "tel"],
      ["/arrangementer/test", "internal"],
    ] as const

    const result = serializePublicDescription(
      links.map(([href, label]) => ({
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: label, marks: [label] }],
        markDefs: [{ _key: label, _type: "link", href }],
      })),
    )

    for (const [, label] of links) {
      expect(result.text).toContain(label)
    }
    expect(result.html).toContain('href="https://example.test"')
    expect(result.html).toContain('href="mailto:events@example.test"')
    expect(result.html).toContain('href="tel:+4712345678"')
    expect(result.html).toContain('href="/arrangementer/test"')
  })
})

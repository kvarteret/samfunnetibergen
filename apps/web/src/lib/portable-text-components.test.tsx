import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { PortableTextContent } from "./portable-text-components"

const blocks = (target = "self") => [
  {
    _key: "paragraph",
    _type: "block",
    style: "normal",
    children: [{ _key: "span", _type: "span", text: "BIFF", marks: ["link"] }],
    markDefs: [
      { _key: "link", _type: "link", href: "https://www.biff.no", target },
    ],
  },
]

describe("event description links", () => {
  it("adds nofollow to same-tab links when requested by an event page", () => {
    const html = renderToStaticMarkup(
      <PortableTextContent value={blocks()} nofollowLinks />,
    )
    expect(html).toContain('rel="nofollow"')
    expect(html).not.toContain('target="_blank"')
  })
  it("keeps new-tab protections with nofollow", () => {
    const html = renderToStaticMarkup(
      <PortableTextContent value={blocks("blank")} nofollowLinks />,
    )
    expect(html).toContain('rel="nofollow noopener noreferrer"')
    expect(html).toContain('target="_blank"')
  })
  it("keeps other Portable Text content's link policy unchanged", () => {
    const html = renderToStaticMarkup(<PortableTextContent value={blocks()} />)
    expect(html).not.toContain("rel=")
  })
})

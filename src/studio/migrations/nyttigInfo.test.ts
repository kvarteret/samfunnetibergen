import { describe, expect, it } from "vitest"

import {
  ACCESSIBILITY_MARKDOWN,
  buildNavbarNyttigItems,
  buildUsefulInfoPageDocument,
  splitAccessibilityMarkdown,
} from "./nyttigInfo"

describe("splitAccessibilityMarkdown", () => {
  it("extracts the top heading and lead paragraph as intro", () => {
    const { heading, intro } = splitAccessibilityMarkdown(
      ACCESSIBILITY_MARKDOWN,
    )

    expect(heading).toBe("Tilgjengelighet ♿️")
    expect(intro).toBe(
      "Studentersamfunnet skal være et sted alle kan bruke. Her finner du en oversikt over hvordan bygget vårt er tilrettelagt, og hvordan du kommer deg inn i de ulike etasjene.",
    )
  })

  it("yields exactly four items with the expected titles", () => {
    const { items } = splitAccessibilityMarkdown(ACCESSIBILITY_MARKDOWN)

    expect(items.map(item => item.title)).toEqual([
      "Heis og etasjer",
      "Av- og påstigning",
      "HC-toaletter",
      "Har du spørsmål om tilgjengelighet?",
    ])
  })

  it("keeps each item's body markdown with the heading stripped", () => {
    const { items } = splitAccessibilityMarkdown(ACCESSIBILITY_MARKDOWN)
    const påstigning = items[1]

    expect(påstigning.markdown).not.toContain("##")
    expect(påstigning.markdown).toContain("1. **I bakgården**")
    expect(påstigning.markdown).toContain("2. **Håkonsgaten**")
  })
})

describe("buildUsefulInfoPageDocument", () => {
  const document = buildUsefulInfoPageDocument()

  it("builds the singleton with the fixed id and one block per topic", () => {
    expect(document._id).toBe("usefulInfoPage")
    expect(document._type).toBe("usefulInfoPage")
    expect(document.sections.map(section => section._type)).toEqual([
      "infoAddressBlock",
      "editorialSection",
      "editorialSection",
      "editorialSection",
      "editorialSection",
      "infoAccordionBlock",
    ])
  })

  it("converts the accessibility markdown into four accordion items", () => {
    const accordion = document.sections.find(
      section => section._type === "infoAccordionBlock",
    )
    expect(accordion && "items" in accordion && accordion.items).toHaveLength(4)
  })

  it("is deterministic so it converges on repeated runs", () => {
    expect(buildUsefulInfoPageDocument()).toEqual(document)
  })
})

describe("buildNavbarNyttigItems", () => {
  it("appends a Nyttig info item when absent", () => {
    const items = buildNavbarNyttigItems({
      _id: "navbar",
      _type: "navbar",
      items: [{ _type: "navItem", _key: "hjem", label: "Hjem", href: "/" }],
    })

    expect(items).toHaveLength(2)
    expect(items?.[1]).toMatchObject({ label: "Nyttig info", href: "/nyttig" })
  })

  it("returns null when the item already exists (idempotent)", () => {
    expect(
      buildNavbarNyttigItems({
        _id: "navbar",
        _type: "navbar",
        items: [{ _type: "navItem", _key: "nyttig-info", href: "/nyttig" }],
      }),
    ).toBeNull()
  })
})

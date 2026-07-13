import { describe, expect, it } from "vitest"

import {
  ACCESSIBILITY_MARKDOWN,
  buildNavbarNyttigItems,
  buildUsefulInfoPageDocument,
  migrateUsefulInfoEditorialSections,
  splitAccessibilityMarkdown,
  VERGEORDNING_FORM_URL,
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

  it("stores editorial sections as portable text bodies", () => {
    const editorial = document.sections.find(
      section => section._type === "editorialSection",
    )

    expect(editorial).toMatchObject({
      _type: "editorialSection",
      body: expect.arrayContaining([
        expect.objectContaining({
          _type: "block",
          children: expect.arrayContaining([
            expect.objectContaining({ _type: "span" }),
          ]),
        }),
      ]),
    })
    expect(editorial).not.toHaveProperty("paragraphs")
  })

  it("stores the vergeordning form link inside the portable text body", () => {
    const vergeordningen = document.sections.find(
      section =>
        section._type === "editorialSection" &&
        "title" in section &&
        section.title === "Vergeordningen",
    )

    expect(vergeordningen).not.toHaveProperty("links")
    expect(JSON.stringify(vergeordningen)).toContain(VERGEORDNING_FORM_URL)
    expect(VERGEORDNING_FORM_URL).toBe(
      "https://forms.clickup.com/2452384/f/2aux0-4032/HNO5KFUM24SKGG2J5I",
    )
  })

  it("is deterministic so it converges on repeated runs", () => {
    expect(buildUsefulInfoPageDocument()).toEqual(document)
  })
})

describe("migrateUsefulInfoEditorialSections", () => {
  it("ports legacy editorial paragraphs to body and removes the old field", () => {
    const migration = migrateUsefulInfoEditorialSections({
      sections: [
        {
          _type: "editorialSection",
          _key: "legacy",
          title: "Legacy",
          paragraphs: ["Første avsnitt.", "Andre avsnitt."],
        },
      ],
    })

    expect(migration.changed).toBe(true)
    expect(migration.sections[0]).toMatchObject({
      _type: "editorialSection",
      body: [
        {
          _key: "legacy-body-b0",
          _type: "block",
          children: expect.arrayContaining([
            expect.objectContaining({ text: "Første avsnitt." }),
          ]),
        },
        {
          _key: "legacy-body-b1",
          _type: "block",
          children: expect.arrayContaining([
            expect.objectContaining({ text: "Andre avsnitt." }),
          ]),
        },
      ],
    })
    expect(migration.sections[0]).not.toHaveProperty("paragraphs")
  })

  it("moves vergeordningen to the external form link in the body", () => {
    const migration = migrateUsefulInfoEditorialSections({
      sections: [
        {
          _type: "editorialSection",
          _key: "verge",
          title: "Vergeordningen",
          body: [{ _key: "body", _type: "block" }],
          links: [
            {
              _type: "sourceLink",
              _key: "old",
              label: "Legg inn søknad her",
              linkType: "internalPage",
              internalPage: { _type: "reference", _ref: "old-page" },
            },
          ],
        },
      ],
    })

    expect(migration.changed).toBe(true)
    expect(migration.sections[0]).not.toHaveProperty("links")
    expect(JSON.stringify(migration.sections[0])).toContain(
      VERGEORDNING_FORM_URL,
    )
  })

  it("moves generic source links into portable text cta blocks", () => {
    const migration = migrateUsefulInfoEditorialSections({
      sections: [
        {
          _type: "editorialSection",
          _key: "billetter",
          title: "Billetter",
          body: [{ _key: "body", _type: "block" }],
          links: [
            {
              _type: "sourceLink",
              _key: "events",
              label: "Arrangementer",
              linkType: "internalPage",
              internalPage: { _type: "reference", _ref: "eventsPage" },
            },
          ],
        },
      ],
    })

    expect(migration.changed).toBe(true)
    expect(migration.sections[0]).not.toHaveProperty("links")
    expect(migration.sections[0]).toMatchObject({
      body: expect.arrayContaining([
        expect.objectContaining({
          markDefs: expect.arrayContaining([
            expect.objectContaining({
              href: "/arrangementer",
              style: "cta",
              target: "self",
            }),
          ]),
        }),
      ]),
    })
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

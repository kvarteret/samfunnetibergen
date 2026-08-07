import { describe, expect, it } from "vitest"

import { buildRetiredVolunteerLinkPatch } from "./retiredVolunteerLinks"

describe("retired volunteer links migration", () => {
  it("repoints the homepage CTA to the groups singleton", () => {
    expect(
      buildRetiredVolunteerLinkPatch({
        _id: "homePage",
        _type: "homePage",
        primaryCta: {
          internalPage: { _ref: "blifrivilligPage", _type: "reference" },
        },
      }),
    ).toEqual({
      "primaryCta.internalPage": {
        _ref: "groupsPage",
        _type: "reference",
      },
    })
  })

  it("rewrites retired navbar paths and is idempotent afterward", () => {
    expect(
      buildRetiredVolunteerLinkPatch({
        _id: "navbar",
        _type: "navbar",
        items: [{ _key: "volunteer", href: "/blifrivillig" }],
      }),
    ).toEqual({
      'items[_key=="volunteer"].href': "/bli-frivillig",
    })
    expect(
      buildRetiredVolunteerLinkPatch({
        _id: "navbar",
        _type: "navbar",
        items: [{ _key: "volunteer", href: "/grupper" }],
      }),
    ).toEqual({
      'items[_key=="volunteer"].href': "/bli-frivillig",
    })
    expect(
      buildRetiredVolunteerLinkPatch({
        _id: "navbar",
        _type: "navbar",
        items: [{ _key: "volunteer", href: "/bli-frivillig" }],
      }),
    ).toEqual({})
  })
})

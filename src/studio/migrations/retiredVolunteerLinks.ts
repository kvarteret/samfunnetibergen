type SanityDocument = {
  _id: string
  _type: string
  [key: string]: unknown
}

const retiredVolunteerPath = "/blifrivillig"

export function buildRetiredVolunteerLinkPatch(document: SanityDocument) {
  if (document._type === "homePage") {
    const primaryCta = document.primaryCta as
      | { internalPage?: { _ref?: string } }
      | undefined

    return primaryCta?.internalPage?._ref === "blifrivilligPage"
      ? {
          "primaryCta.internalPage": {
            _type: "reference",
            _ref: "groupsPage",
          },
        }
      : {}
  }

  if (document._type === "navbar") {
    const items = Array.isArray(document.items) ? document.items : []
    return Object.fromEntries(
      items.flatMap(item => {
        if (
          typeof item !== "object" ||
          item === null ||
          !("_key" in item) ||
          !("href" in item) ||
          item.href !== retiredVolunteerPath ||
          typeof item._key !== "string"
        ) {
          return []
        }

        return [[`items[_key=="${item._key}"].href`, "/grupper"]]
      }),
    )
  }

  return {}
}

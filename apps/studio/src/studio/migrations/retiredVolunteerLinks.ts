type SanityDocument = {
  _id: string
  _type: string
  [key: string]: unknown
}

const retiredVolunteerPaths = new Set(["/blifrivillig", "/grupper"])
const canonicalVolunteerPath = "/bli-frivillig"

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
          !retiredVolunteerPaths.has(item.href) ||
          typeof item._key !== "string"
        ) {
          return []
        }

        return [[`items[_key=="${item._key}"].href`, canonicalVolunteerPath]]
      }),
    )
  }

  return {}
}

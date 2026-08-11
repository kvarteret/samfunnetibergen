type SanityDocument = {
  _id: string
  _type: string
  [key: string]: unknown
}

const defaultsByType: Record<string, Record<string, unknown>> = {
  arrangement: {
    approvalStatus: "pending",
    eventStatus: "scheduled",
    isFree: false,
    isInternalEvent: false,
    isPromoted: false,
    isRecurring: false,
  },
  footer: {
    socialLinks: [],
  },
  groupsPage: {
    faq: [],
    sections: [],
  },
  linkInBio: {
    links: [],
  },
  room: {
    hasAV: false,
    hasLighting: false,
    hasSound: false,
    images: [],
    suitedPurposes: [],
  },
  roomsPage: {
    floorPlans: [],
    sections: [],
  },
  siteMetadata: {
    houseClosedDates: [],
  },
  sponsorsPage: {
    sponsors: [],
  },
  studentGroup: {
    labels: [],
  },
}

export function buildDefaultPatch(document: SanityDocument) {
  const defaults = defaultsByType[document._type]
  if (!defaults) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(defaults).filter(([field]) => document[field] == null),
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function hasSlug(value: unknown) {
  return (
    typeof value === "object" &&
    value !== null &&
    "current" in value &&
    isNonEmptyString(value.current)
  )
}

function asRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
    : []
}

export function findRequiredViolations(document: SanityDocument): string[] {
  const missing: string[] = []
  const requireString = (field: string) => {
    if (!isNonEmptyString(document[field])) {
      missing.push(field)
    }
  }
  const requireSlug = () => {
    if (!hasSlug(document.slug)) {
      missing.push("slug.current")
    }
  }

  if (document._type === "arrangement") {
    requireString("title")
    requireSlug()
    requireString("approvalStatus")
    requireString("eventStatus")
    if (!Array.isArray(document.dates) || document.dates.length === 0) {
      missing.push("dates")
    } else if (
      document.dates.some(
        date =>
          typeof date !== "object" ||
          date === null ||
          !("startDate" in date) ||
          !isNonEmptyString(date.startDate),
      )
    ) {
      missing.push("dates[].startDate")
    }
  }

  if (document._type === "room") {
    requireString("title")
    requireString("summary")
    requireSlug()
  }

  if (document._type === "studentGroup") {
    requireString("name")
    requireString("summary")
    requireString("category")
    requireSlug()
  }

  if (document._type === "page") {
    requireString("title")
    requireSlug()
  }

  if (
    ["homePage", "roomsPage", "groupsPage", "sponsorsPage"].includes(
      document._type,
    )
  ) {
    requireString("title")
  }

  if (document._type === "linkInBio") {
    requireString("heading")
  }

  if (document._type === "eventType") {
    requireString("name")
    requireSlug()
    if (document.taxonomyGroup == null) {
      missing.push("taxonomyGroup")
    }
  }

  if (document._type === "eventTaxonomyGroup") {
    requireString("name")
    requireSlug()
  }

  if (document._type === "internbevisBenefit") {
    requireString("name")
    requireString("minimumTier")
  }

  if (document._type === "footer") {
    asRecords(document.socialLinks).forEach((link, index) => {
      for (const field of ["platform", "label", "url"]) {
        if (!isNonEmptyString(link[field])) {
          missing.push(`socialLinks[${index}].${field}`)
        }
      }
    })
  }

  if (document._type === "navbar") {
    const items = asRecords(document.items)
    if (items.length === 0) missing.push("items")
    items.forEach((item, itemIndex) => {
      if (!isNonEmptyString(item.label)) {
        missing.push(`items[${itemIndex}].label`)
      }
      asRecords(item.children).forEach((group, groupIndex) => {
        const leaves = asRecords(group.items)
        if (leaves.length === 0) {
          missing.push(`items[${itemIndex}].children[${groupIndex}].items`)
        }
        leaves.forEach((leaf, leafIndex) => {
          if (!isNonEmptyString(leaf.label)) {
            missing.push(
              `items[${itemIndex}].children[${groupIndex}].items[${leafIndex}].label`,
            )
          }
        })
      })
    })
  }

  if (document._type === "kontaktPage") {
    asRecords(document.contactGroups).forEach((group, groupIndex) => {
      if (!isNonEmptyString(group.title)) {
        missing.push(`contactGroups[${groupIndex}].title`)
      }
      asRecords(group.persons).forEach((person, personIndex) => {
        if (!isNonEmptyString(person.name)) {
          missing.push(
            `contactGroups[${groupIndex}].persons[${personIndex}].name`,
          )
        }
      })
    })
  }

  if (document._type === "siteMetadata") {
    asRecords(document.houseClosedDates).forEach((entry, index) => {
      if (!isNonEmptyString(entry.date)) {
        missing.push(`houseClosedDates[${index}].date`)
      }
    })
  }

  if (document._type === "roomsPage") {
    asRecords(document.floorPlans).forEach((plan, index) => {
      if (typeof plan.floor !== "number") {
        missing.push(`floorPlans[${index}].floor`)
      }
      if (
        typeof plan.file !== "object" ||
        plan.file === null ||
        !("asset" in plan.file)
      ) {
        missing.push(`floorPlans[${index}].file`)
      }
    })
  }

  if (document._type === "sponsorsPage") {
    asRecords(document.sponsors).forEach((sponsor, index) => {
      if (!isNonEmptyString(sponsor.title)) {
        missing.push(`sponsors[${index}].title`)
      }
    })
  }

  return missing
}

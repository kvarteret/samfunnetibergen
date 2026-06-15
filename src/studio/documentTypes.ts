export const singletonTypeNames = [
  "siteMetadata",
  "footer",
  "homePage",
  "eventsPage",
  "roomsPage",
  "groupsPage",
  "sponsorsPage",
  "kontaktPage",
  "navbar",
  "linkInBio",
  "internbevisPage",
] as const

export const studioDocumentTypeNames = [
  ...singletonTypeNames,
  "page",
  "arrangement",
  "eventTaxonomyGroup",
  "eventType",
  "internbevisBenefit",
  "room",
  "studentGroup",
] as const

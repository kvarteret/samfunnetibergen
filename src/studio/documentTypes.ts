export const singletonTypeNames = [
  "siteMetadata",
  "footer",
  "homePage",
  "roomsPage",
  "groupsPage",
  "sponsorsPage",
  "usefulInfoPage",
  "kontaktPage",
  "navbar",
  "linkInBio",
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

export const singletonTypeNames = [
  "siteMetadata",
  "siteLogo",
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
  "eventPromotionChange",
  "eventTaxonomyGroup",
  "eventType",
  "internbevisBenefit",
  "room",
  "studentGroup",
] as const

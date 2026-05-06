import { defineQuery } from "next-sanity"

export const launchGroupsNbQuery = defineQuery(`*[_type == "launchGroup"] | order(_createdAt asc) {
    slug,
    "name": nameNb,
    "eyebrow": eyebrowNb,
    "lead": leadNb,
    "imageUrl": image.asset->url,
    "accordionSections": accordionSections[] {
        "title": titleNb,
        "paragraphs": paragraphsNb
    },
    "detailSections": detailSections[] {
        "title": titleNb,
        "paragraphs": paragraphsNb
    }
}`)

export const launchGroupsEnQuery = defineQuery(`*[_type == "launchGroup"] | order(_createdAt asc) {
    slug,
    "name": nameEn,
    "eyebrow": eyebrowEn,
    "lead": leadEn,
    "imageUrl": image.asset->url,
    "accordionSections": accordionSections[] {
        "title": titleEn,
        "paragraphs": paragraphsEn
    },
    "detailSections": detailSections[] {
        "title": titleEn,
        "paragraphs": paragraphsEn
    }
}`)

export const volunteerGroupSummariesNbQuery = defineQuery(`*[_type == "volunteerGroupSummary"] | order(order asc) {
    name,
    "description": descriptionNb
}`)

export const volunteerGroupSummariesEnQuery = defineQuery(`*[_type == "volunteerGroupSummary"] | order(order asc) {
    name,
    "description": descriptionEn
}`)

export const homePageContentNbQuery = defineQuery(`*[_id == "homePage"][0] {
    "badge": badgeNb,
    "heroDescription": heroDescriptionNb,
    "heroDescriptionFusion": heroDescriptionFusionNb,
    "eventsLink": eventsLinkNb
}`)

export const homePageContentEnQuery = defineQuery(`*[_id == "homePage"][0] {
    "badge": badgeEn,
    "heroDescription": heroDescriptionEn,
    "heroDescriptionFusion": heroDescriptionFusionEn,
    "eventsLink": eventsLinkEn
}`)

export const eventsPageContentNbQuery = defineQuery(`*[_id == "eventsPage"][0] {
    "eyebrow": eyebrowNb,
    "title": titleNb,
    "description": descriptionNb
}`)

export const eventsPageContentEnQuery = defineQuery(`*[_id == "eventsPage"][0] {
    "eyebrow": eyebrowEn,
    "title": titleEn,
    "description": descriptionEn
}`)

export const siteMetadataNbQuery = defineQuery(`*[_id == "siteMetadata"][0] {
    "siteTitle": siteTitleNb,
    "siteDescription": siteDescriptionNb,
    "homeTitle": homeTitleNb,
    "homeDescription": homeDescriptionNb,
    "eventsTitle": eventsTitleNb,
    "eventsDescription": eventsDescriptionNb,
    "volunteerSignupTitle": volunteerSignupTitleNb,
    "volunteerSignupDescription": volunteerSignupDescriptionNb,
    "groupPageTitle": groupPageTitleNb,
    "groupPageDescription": groupPageDescriptionNb
}`)

export const siteMetadataEnQuery = defineQuery(`*[_id == "siteMetadata"][0] {
    "siteTitle": siteTitleEn,
    "siteDescription": siteDescriptionEn,
    "homeTitle": homeTitleEn,
    "homeDescription": homeDescriptionEn,
    "eventsTitle": eventsTitleEn,
    "eventsDescription": eventsDescriptionEn,
    "volunteerSignupTitle": volunteerSignupTitleEn,
    "volunteerSignupDescription": volunteerSignupDescriptionEn,
    "groupPageTitle": groupPageTitleEn,
    "groupPageDescription": groupPageDescriptionEn
}`)

export const homeBarsNbQuery = defineQuery(`*[_type == "homeBar"] | order(order asc) {
    "name": nameNb,
    "description": descriptionNb,
    "imageUrl": image.asset->url
}`)

export const homeBarsEnQuery = defineQuery(`*[_type == "homeBar"] | order(order asc) {
    "name": nameEn,
    "description": descriptionEn,
    "imageUrl": image.asset->url
}`)

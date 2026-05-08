import { defineQuery } from "next-sanity"

// ─── Shared projections ─────────────────────────────────────────────────────

const editorialSectionProjection = `{
    _key,
    title,
    paragraphs,
    links[] {
        _key,
        label,
        url
    }
}`

const sourcedImageProjection = `{
    _key,
    "assetUrl": image.asset->url,
    sourceUrl,
    alt,
    caption
}`

const durationProjection = `{
    start,
    end
}`

const openingHoursProjection = `{
    rows[] {
        _key,
        label,
        "status": coalesce(status, select(closed == true => "closed", "open")),
        note,
        "duration": duration ${durationProjection}
    }
}`

// ─── Volunteer content ───────────────────────────────────────────────────────

export const volunteerGroupsNbQuery =
    defineQuery(`*[_type == "studentGroup" && category == "arbeidsgruppe"] | order(orderRank asc, name asc) {
    "slug": slug.current,
    name,
    "eyebrow": null,
    "lead": summary,
    "imageUrl": image.image.asset->url,
    "accordionSections": [],
    "detailSections": []
}`)

export const volunteerGroupsEnQuery =
    defineQuery(`*[_type == "studentGroup" && category == "arbeidsgruppe"] | order(orderRank asc, name asc) {
    "slug": slug.current,
    name,
    "eyebrow": null,
    "lead": summary,
    "imageUrl": image.image.asset->url,
    "accordionSections": [],
    "detailSections": []
}`)

export const volunteerGroupSummariesNbQuery =
    defineQuery(`*[_type == "studentGroup" && category == "arbeidsgruppe"] | order(orderRank asc, name asc) {
    name,
    "description": summary
}`)

export const volunteerGroupSummariesEnQuery =
    defineQuery(`*[_type == "studentGroup" && category == "arbeidsgruppe"] | order(orderRank asc, name asc) {
    name,
    "description": summary
}`)

// ─── Home page ───────────────────────────────────────────────────────────────

export const homePageContentNbQuery = defineQuery(`*[_type == "homePage" && _id == "homePage"][0] {
    "badge": badgeNb,
    "heroDescription": heroDescriptionNb,
    "heroDescriptionFusion": heroDescriptionFusionNb,
    "eventsLink": eventsLinkNb
}`)

export const homePageContentEnQuery = defineQuery(`*[_type == "homePage" && _id == "homePage"][0] {
    "badge": badgeEn,
    "heroDescription": heroDescriptionEn,
    "heroDescriptionFusion": heroDescriptionFusionEn,
    "eventsLink": eventsLinkEn
}`)

// ─── Events page ─────────────────────────────────────────────────────────────

export const eventsPageContentNbQuery =
    defineQuery(`*[_type == "eventsPage" && _id == "eventsPage"][0] {
    "eyebrow": eyebrowNb,
    "title": titleNb,
    "description": descriptionNb
}`)

export const eventsPageContentEnQuery =
    defineQuery(`*[_type == "eventsPage" && _id == "eventsPage"][0] {
    "eyebrow": eyebrowEn,
    "title": titleEn,
    "description": descriptionEn
}`)

// ─── Site metadata ────────────────────────────────────────────────────────────

export const siteMetadataNbQuery =
    defineQuery(`*[_type == "siteMetadata" && _id == "siteMetadata"][0] {
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

export const siteMetadataEnQuery =
    defineQuery(`*[_type == "siteMetadata" && _id == "siteMetadata"][0] {
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

// ─── Blifrivillig page ────────────────────────────────────────────────────────

export const blifrivilligPageNbQuery =
    defineQuery(`*[_type == "blifrivilligPage" && _id == "blifrivilligPage"][0] {
    "title": titleNb,
    "seoDescription": seoDescription,
    "description": description[]
}`)

export const blifrivilligPageEnQuery =
    defineQuery(`*[_type == "blifrivilligPage" && _id == "blifrivilligPage"][0] {
    "title": titleEn,
    "seoDescription": seoDescription,
    "description": description[]
}`)

// ─── Home bars ────────────────────────────────────────────────────────────────

export const homeBarsNbQuery = defineQuery(`*[_type == "homeBar"] | order(orderRank asc) {
    "name": nameNb,
    "description": descriptionNb,
    "imageUrl": image.asset->url
}`)

export const homeBarsEnQuery = defineQuery(`*[_type == "homeBar"] | order(orderRank asc) {
    "name": nameEn,
    "description": descriptionEn,
    "imageUrl": image.asset->url
}`)

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const roomsPageQuery = defineQuery(`*[_type == "roomsPage" && _id == "roomsPage"][0] {
    eyebrow,
    title,
    description,
    "sections": sections[] ${editorialSectionProjection},
    bookingLink {
        label,
        url
    }
}`)

export const roomsQuery = defineQuery(`*[_type == "room"] | order(orderRank asc) {
    title,
    "slug": slug.current,
    summary,
    capacityStanding,
    capacitySeated,
    suitedPurposes,
    floor,
    bar,
    hasSound,
    hasLighting,
    hasAV,
    "image": images[0] ${sourcedImageProjection}
}`)

export const roomSlugsQuery = defineQuery(`*[_type == "room" && defined(slug.current)] {
    "slug": slug.current
}`)

export const roomBySlugQuery = defineQuery(`*[_type == "room" && slug.current == $slug][0] {
    title,
    "slug": slug.current,
    summary,
    capacityStanding,
    capacitySeated,
    suitedPurposes,
    floor,
    bar,
    hasSound,
    hasLighting,
    hasAV,
    specsUrl,
    "openingHours": openingHours ${openingHoursProjection},
    body[] {
        _key,
        _type,
        ...,
        markDefs[] {
            ...,
            _type == "link" => {
                ...,
                "target": coalesce(target, select(blank == true => "blank", "self"))
            }
        },
        _type == "image" => {
            "imageUrl": asset->url,
            alt,
            caption
        }
    },
    "images": images[] ${sourcedImageProjection}
}`)

// ─── Groups ───────────────────────────────────────────────────────────────────

export const groupsPageQuery = defineQuery(`*[_type == "groupsPage" && _id == "groupsPage"][0] {
    eyebrow,
    title,
    description,
    "sections": sections[] ${editorialSectionProjection},
    faq[] {
        _key,
        question,
        answer
    }
}`)

export const studentGroupsQuery = defineQuery(`*[_type == "studentGroup"] | order(orderRank asc) {
    name,
    "slug": slug.current,
    summary,
    email,
    website,
    category,
    "image": image ${sourcedImageProjection}
}`)

export const studentGroupsByCategory = defineQuery(`
    *[_type == "studentGroup" && category == $category] | order(orderRank asc) {
    name,
    "slug": slug.current,
    summary,
    email,
    website,
    category,
    "image": image ${sourcedImageProjection}
}`)

export const studentGroupSlugsQuery =
    defineQuery(`*[_type == "studentGroup" && defined(slug.current)] {
    "slug": slug.current
}`)

export const studentGroupBySlugQuery =
    defineQuery(`*[_type == "studentGroup" && slug.current == $slug][0] {
    name,
    "slug": slug.current,
    summary,
    body,
    email,
    website,
    category,
    "parentGroup": parentGroup-> {
        name,
        "slug": slug.current
    },
    "image": image ${sourcedImageProjection}
}`)

// ─── Pages ───────────────────────────────────────────────────────────────────

export const pageSlugsQuery = defineQuery(`*[_type == "page" && defined(slug.current)] {
    "slug": slug.current
}`)

export const pageBySlugQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    seoTitle,
    seoDescription,
    content[] {
        _key,
        _type,
        ...,
        markDefs[] {
            ...,
            _type == "link" => {
                ...,
                "target": coalesce(target, select(blank == true => "blank", "self"))
            }
        },
        _type == "image" => {
            "imageUrl": asset->url,
            alt,
            caption
        }
    }
}`)

// ─── Arrangements ────────────────────────────────────────────────────────────

export const arrangementRoomsQuery = defineQuery(`
    *[_type == "room"] | order(orderRank asc) {
    _id,
    title,
    "slug": slug.current
}`)

export const arrangementEventTypesQuery = defineQuery(`
    *[_type == "eventType" && isActive != false] | order(sortOrder asc, name asc) {
    _id,
    name,
    "slug": slug.current,
    "taxonomyGroup": taxonomyGroup-> {
        _id,
        name,
        "slug": slug.current
    }
}`)

export const arrangementGroupsQuery = defineQuery(`
    *[_type == "studentGroup"] | order(orderRank asc, name asc) {
    _id,
    name,
    category
}`)

export const publishedArrangementsQuery = defineQuery(`
    *[_type == "arrangement" && approvalStatus == "approved"] | order(dates[0].startDate asc) {
    _id,
    title,
    "slug": slug.current,
    approvalStatus,
    language,
    isRecurring,
    rrule,
    "dates": dates[] {
        _key,
        startDate,
        startTime,
        endTime
    },
    isFree,
    priceOrdinar,
    priceStudent,
    priceMedlem,
    ticketUrl,
    facebookUrl,
    "imageUrl": image.asset->url,
    imageCaption,
    "room": room-> { _id, title, "slug": slug.current },
    roomText,
    "organizerGroup": organizerGroup-> { _id, name, "slug": slug.current },
    organizerText,
    "eventType": eventType-> {
        _id,
        name,
        "slug": slug.current,
        "taxonomyGroup": taxonomyGroup-> { _id, name, "slug": slug.current }
    },
    description[] {
        _key,
        _type,
        ...,
        markDefs[] {
            ...,
            _type == "link" => {
                ...,
                "target": coalesce(target, select(blank == true => "blank", "self"))
            }
        },
        _type == "image" => {
            "imageUrl": asset->url,
            alt,
            caption
        }
    }
}`)

export const arrangementBySlugQuery = defineQuery(`
    *[_type == "arrangement" && slug.current == $slug && approvalStatus == "approved"][0] {
    _id,
    title,
    "slug": slug.current,
    approvalStatus,
    language,
    isRecurring,
    rrule,
    "dates": dates[] {
        _key,
        startDate,
        startTime,
        endTime
    },
    isFree,
    priceOrdinar,
    priceStudent,
    priceMedlem,
    ticketUrl,
    facebookUrl,
    "imageUrl": image.asset->url,
    imageCaption,
    "room": room-> { _id, title, "slug": slug.current },
    roomText,
    "organizerGroup": organizerGroup-> { _id, name, "slug": slug.current },
    organizerText,
    "eventType": eventType-> {
        _id,
        name,
        "slug": slug.current,
        "taxonomyGroup": taxonomyGroup-> { _id, name, "slug": slug.current }
    },
    description[] {
        _key,
        _type,
        ...,
        markDefs[] {
            ...,
            _type == "link" => {
                ...,
                "target": coalesce(target, select(blank == true => "blank", "self"))
            }
        },
        _type == "image" => {
            "imageUrl": asset->url,
            alt,
            caption
        }
    }
}`)

export const eventTaxonomyGroupsQuery = defineQuery(`
    *[_type == "eventTaxonomyGroup" && isActive != false] | order(sortOrder asc, name asc) {
    _id,
    name,
    nameEn,
    "slug": slug.current
}`)

// ─── Kontakt page ─────────────────────────────────────────────────────────────

export const kontaktPageQuery = defineQuery(`*[_type == "kontaktPage" && _id == "kontaktPage"][0] {
    visitAddress,
    postAddress,
    invoiceAddress,
    invoiceEmail,
    ehf,
    generalContact,
    pressContact,
    "contactGroups": contactGroups[] {
        _key,
        title,
        "persons": persons[] {
            _key,
            name,
            email,
            phone,
            "imageUrl": image.asset->url
        }
    }
}`)

// ─── Navbar ───────────────────────────────────────────────────────────────────

export const navbarQuery = defineQuery(`*[_type == "navbar" && _id == "navbar"][0] {
    items[] {
        _key,
        label,
        href,
        externalUrl,
        children[] {
            _key,
            groupLabel,
            items[] {
                _key,
                label,
                href,
                externalUrl
            }
        }
    }
}`)

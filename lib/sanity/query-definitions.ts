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
    defineQuery(`*[_type == "studentGroup" && category == "arbeidsgruppe" && isRecruiting == true] | order(orderRank asc, name asc) {
    "slug": slug.current,
    name,
    "eyebrow": recruitmentLabel,
    "lead": coalesce(recruitmentLead, summary),
    "imageUrl": image.image.asset->url,
    "accordionSections": recruitmentSections[] {
        _key,
        title,
        paragraphs
    },
    "detailSections": []
}`)

export const volunteerGroupSummariesNbQuery =
    defineQuery(`*[_type == "studentGroup" && category == "arbeidsgruppe" && isRecruiting == true] | order(orderRank asc, name asc) {
    name,
    "description": coalesce(recruitmentLead, summary)
}`)

// ─── Events page ─────────────────────────────────────────────────────────────

export const eventsPageContentNbQuery =
    defineQuery(`*[_type == "eventsPage" && _id == "eventsPage"][0] {
    "eyebrow": coalesce(eyebrow, eyebrowNb),
    "title": coalesce(title, titleNb),
    "description": coalesce(description, descriptionNb)
}`)

// ─── Site metadata ────────────────────────────────────────────────────────────

export const siteMetadataNbQuery =
    defineQuery(`*[_type == "siteMetadata" && _id == "siteMetadata"][0] {
    "homeTitle": coalesce(homeTitle, homeTitleNb),
    "homeDescription": coalesce(homeDescription, homeDescriptionNb),
    "eventsTitle": coalesce(eventsTitle, eventsTitleNb),
    "eventsDescription": coalesce(eventsDescription, eventsDescriptionNb)
}`)

// ─── Blifrivillig page ────────────────────────────────────────────────────────

export const blifrivilligPageNbQuery =
    defineQuery(`*[_type == "blifrivilligPage" && _id == "blifrivilligPage"][0] {
    "title": coalesce(title, titleNb),
    "seoDescription": seoDescription,
    "description": description[]
}`)

// ─── Home bars ────────────────────────────────────────────────────────────────

export const homeBarsNbQuery = defineQuery(`*[_type == "homeBar"] | order(orderRank asc) {
    "name": nameNb,
    "description": descriptionNb,
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
    "title": coalesce(title, ""),
    "slug": coalesce(slug.current, "")
}`)

export const arrangementEventTypesQuery = defineQuery(`
    *[_type == "eventType" && isActive != false] | order(taxonomyGroup->orderRank asc, orderRank asc, name asc) {
    _id,
    "name": coalesce(name, ""),
    "slug": coalesce(slug.current, ""),
    "taxonomyGroup": taxonomyGroup-> {
        _id,
        "name": coalesce(name, ""),
        "slug": coalesce(slug.current, "")
    }
}`)

export const arrangementGroupsQuery = defineQuery(`
    *[_type == "studentGroup"] | order(orderRank asc, name asc) {
    _id,
    "name": coalesce(name, ""),
    "category": coalesce(category, "")
}`)

export const publishedArrangementsQuery = defineQuery(`
    *[_type == "arrangement" && approvalStatus == "approved" && count(dates[startDate >= $today]) > 0] | order(dates[startDate >= $today][0].startDate asc) {
    _id,
    "title": coalesce(title, ""),
    "slug": coalesce(slug.current, ""),
    approvalStatus,
    isRecurring,
    rrule,
    "dates": dates[startDate >= $today] | order(startDate asc) {
        _key,
        "startDate": coalesce(startDate, ""),
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
    "room": room-> { _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, "") },
    roomText,
    "organizerGroup": organizerGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") },
    organizerText,
    "eventType": eventType-> {
        _id,
        "name": coalesce(name, ""),
        "slug": coalesce(slug.current, ""),
        "taxonomyGroup": taxonomyGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") }
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
    *[_type == "arrangement" && slug.current == $slug && approvalStatus == "approved" && count(dates[startDate >= $today]) > 0][0] {
    _id,
    "title": coalesce(title, ""),
    "slug": coalesce(slug.current, ""),
    approvalStatus,
    isRecurring,
    rrule,
    "dates": dates[startDate >= $today] | order(startDate asc) {
        _key,
        "startDate": coalesce(startDate, ""),
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
    "room": room-> { _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, "") },
    roomText,
    "organizerGroup": organizerGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") },
    organizerText,
    "eventType": eventType-> {
        _id,
        "name": coalesce(name, ""),
        "slug": coalesce(slug.current, ""),
        "taxonomyGroup": taxonomyGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") }
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
    *[_type == "eventTaxonomyGroup" && isActive != false] | order(orderRank asc, name asc) {
    _id,
    "name": coalesce(name, ""),
    "slug": coalesce(slug.current, "")
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
            rolle,
            email,
            phone,
            "imageUrl": image.asset->url
        }
    }
}`)

// ─── Navbar ───────────────────────────────────────────────────────────────────

// ─── Footer ───────────────────────────────────────────────────────────────────

// Anonymous object — always returns data regardless of whether the footer doc exists.
export const footerQuery = defineQuery(`{
    "socialLinks": *[_type == "footer" && _id == "footer"][0].socialLinks[] {
        _key,
        platform,
        label,
        url
    },
    "visitAddress": *[_type == "kontaktPage" && _id == "kontaktPage"][0].visitAddress,
    "generalContact": *[_type == "kontaktPage" && _id == "kontaktPage"][0].generalContact,
    "roomHours": *[_type == "room" && slug.current in ["grondahls", "stjernesalen"]] | order(title asc) {
        "title": coalesce(title, ""),
        "slug": slug.current,
        "hours": openingHours ${openingHoursProjection}
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

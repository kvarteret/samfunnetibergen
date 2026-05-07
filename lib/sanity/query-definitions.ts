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

const openingHoursProjection = `{
    note,
    hours[] {
        _key,
        day,
        opens,
        closes,
        closed
    }
}`

// ─── Legacy volunteer / home content (blifrivillig – kept for compat) ────────

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

export const volunteerGroupSummariesNbQuery =
    defineQuery(`*[_type == "volunteerGroupSummary"] | order(order asc) {
    name,
    "description": descriptionNb
}`)

export const volunteerGroupSummariesEnQuery =
    defineQuery(`*[_type == "volunteerGroupSummary"] | order(order asc) {
    name,
    "description": descriptionEn
}`)

// ─── Home page ───────────────────────────────────────────────────────────────

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

// ─── Events page ─────────────────────────────────────────────────────────────

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

// ─── Site metadata ────────────────────────────────────────────────────────────

export const siteMetadataNbQuery = defineQuery(`*[_id == "siteMetadata"][0] {
    "siteTitle": siteTitleNb,
    "siteDescription": siteDescriptionNb,
    "homeTitle": homeTitleNb,
    "homeDescription": homeDescriptionNb,
    "eventsTitle": eventsTitleNb,
    "eventsDescription": eventsDescriptionNb,
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
    "groupPageTitle": groupPageTitleEn,
    "groupPageDescription": groupPageDescriptionEn
}`)

// ─── Home bars ────────────────────────────────────────────────────────────────

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

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const roomsPageQuery = defineQuery(`*[_id == "roomsPage"][0] {
    eyebrow,
    title,
    description,
    "sections": sections[] ${editorialSectionProjection},
    bookingLink {
        label,
        url
    }
}`)

export const roomsQuery = defineQuery(`*[_type == "room"] | order(order asc) {
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
    "openingHours": openingHours ${openingHoursProjection},
    "sections": sections[] ${editorialSectionProjection},
    "images": images[] ${sourcedImageProjection}
}`)

// ─── Groups ───────────────────────────────────────────────────────────────────

export const groupsPageQuery = defineQuery(`*[_id == "groupsPage"][0] {
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

export const studentGroupsQuery = defineQuery(`*[_type == "studentGroup"] | order(order asc) {
    name,
    "slug": slug.current,
    summary,
    email,
    website,
    category,
    "image": image ${sourcedImageProjection}
}`)

export const studentGroupsByCategory = defineQuery(`
    *[_type == "studentGroup" && category == $category] | order(order asc) {
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

// ─── Pages (page builder) ─────────────────────────────────────────────────────

export const pageSlugsQuery = defineQuery(`*[_type == "page" && defined(slug.current)] {
    "slug": slug.current
}`)

export const pageBySlugQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    seoTitle,
    seoDescription,
    pageBuilder[] {
        _key,
        _type,
        // heroBlock
        _type == "heroBlock" => {
            eyebrow,
            title,
            lead,
            "imageUrl": image.asset->url,
            cta { label, url }
        },
        // richTextBlock
        _type == "richTextBlock" => {
            title,
            content,
            columns
        },
        // imageBlock
        _type == "imageBlock" => {
            "imageUrl": image.asset->url,
            alt,
            caption,
            size
        },
        // calloutBlock
        _type == "calloutBlock" => {
            title,
            content,
            tone,
            links[] { _key, label, url }
        }
    }
}`)

// ─── Navbar ───────────────────────────────────────────────────────────────────

export const navbarQuery = defineQuery(`*[_id == "navbar"][0] {
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

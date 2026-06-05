import { defineQuery } from "next-sanity"
import { sourceLinkProjection } from "../fragments/links"
import { portableTextProjection } from "../fragments/portableText"
import { openingHoursProjection } from "../fragments/rooms"
import { editorialSectionProjection } from "../fragments/sections"

export const siteMetadataNbQuery =
    defineQuery(`*[_type == "siteMetadata" && _id == "siteMetadata"][0] {
    "siteName": coalesce(siteName, "Samfunnet i Bergen"),
    "defaultSeoTitle": coalesce(defaultSeoTitle, homeTitle, homeTitleNb),
    "defaultSeoDescription": coalesce(defaultSeoDescription, homeDescription, homeDescriptionNb),
    defaultOpenGraphTitle,
    defaultOpenGraphDescription,
    "defaultOpenGraphImageUrl": defaultOpenGraphImage.asset->url,
    oembedTitle,
    oembedDescription,
    "oembedImageUrl": oembedImage.asset->url
}`)

export const houseHoursQuery = defineQuery(`*[_type == "siteMetadata" && _id == "siteMetadata"][0] {
    "operationsManagerHours": openingHours ${openingHoursProjection},
    "houseClosedDates": houseClosedDates[] {
        _key,
        date,
        note
    }
}`)

export const homePageNbQuery = defineQuery(`*[_type == "homePage" && _id == "homePage"][0] {
    eyebrow,
    title,
    description,
    primaryCta ${sourceLinkProjection},
    seoTitle,
    seoDescription,
    openGraphTitle,
    openGraphDescription,
    "openGraphImageUrl": openGraphImage.asset->url,
    oembedTitle,
    oembedDescription,
    "oembedImageUrl": oembedImage.asset->url
}`)

export const blifrivilligPageNbQuery =
    defineQuery(`*[_type == "blifrivilligPage" && _id == "blifrivilligPage"][0] {
    "title": coalesce(title, titleNb),
    seoTitle,
    seoDescription,
    "description": description[],
    "recruitingGroups": recruitingGroups[]-> {
        _id,
        name,
        "slug": slug.current
    }
}`)

export const roomsPageQuery = defineQuery(`*[_type == "roomsPage" && _id == "roomsPage"][0] {
    eyebrow,
    title,
    description,
    seoTitle,
    seoDescription,
    "sections": sections[] ${editorialSectionProjection},
    bookingLink ${sourceLinkProjection}
}`)

export const sponsorsPageQuery =
    defineQuery(`*[_type == "sponsorsPage" && _id == "sponsorsPage"][0] {
    eyebrow,
    title,
    description,
    seoTitle,
    seoDescription,
    sponsors[] {
        _key,
        title,
        website,
        "logoUrl": logo.asset->url,
        "logoAlt": coalesce(logo.alt, title),
        description[] ${portableTextProjection}
    }
}`)

export const groupsPageQuery = defineQuery(`*[_type == "groupsPage" && _id == "groupsPage"][0] {
    eyebrow,
    title,
    description,
    seoTitle,
    seoDescription,
    "sections": sections[] ${editorialSectionProjection},
    faq[] {
        _key,
        question,
        answer
    }
}`)

export const pageSlugsQuery = defineQuery(`*[_type == "page" && defined(slug.current)] {
    "slug": slug.current
}`)

export const pageBySlugQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    seoTitle,
    seoDescription,
    content
}`)

export const kontaktPageQuery = defineQuery(`*[_type == "kontaktPage" && _id == "kontaktPage"][0] {
    visitAddress,
    postAddress,
    invoiceAddress,
    invoiceEmail,
    ehf,
    generalContact,
    pressContact,
    seoTitle,
    seoDescription,
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

export const linkInBioQuery = defineQuery(`*[_type == "linkInBio"][0] {
    heading,
    bio,
    links[] {
        _key,
        link ${sourceLinkProjection},
        emoji,
        highlight
    }
}`)

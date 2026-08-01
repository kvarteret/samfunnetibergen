import { defineQuery } from "next-sanity"
import { sourceLinkProjection } from "../fragments/links"
import { portableTextProjection } from "../fragments/portableText"
import { openingHoursProjection } from "../fragments/rooms"
import {
  editorialSectionProjection,
  infoAccordionBlockProjection,
  infoAddressBlockProjection,
} from "../fragments/sections"

export const houseHoursQuery =
  defineQuery(`*[_type == "siteMetadata" && _id == "siteMetadata"][0] {
    "operationsManagerHours": openingHours ${openingHoursProjection},
    "vacationMode": {
        "enabled": coalesce(vacationMode.enabled, false),
        "from": vacationMode.from,
        "to": coalesce(vacationMode.to, vacationMode.reopensAt)
    },
    "houseClosedDates": coalesce(houseClosedDates[] {
        _key,
        "date": coalesce(date, ""),
        note
    }, [])
}`)

export const homePageNbQuery =
  defineQuery(`*[_type == "homePage" && _id == "homePage"][0] {
    eyebrow,
    "title": coalesce(title, "[Mangler tittel]"),
    description,
    primaryCta ${sourceLinkProjection}
}`)

export const roomsPageQuery =
  defineQuery(`*[_type == "roomsPage" && _id == "roomsPage"][0] {
    eyebrow,
    "title": coalesce(title, "[Mangler tittel]"),
    description,
    "sections": coalesce(sections[] ${editorialSectionProjection}, []),
    bookingLink ${sourceLinkProjection}
}`)

export const sponsorsPageQuery =
  defineQuery(`*[_type == "sponsorsPage" && _id == "sponsorsPage"][0] {
    eyebrow,
    "title": coalesce(title, "[Mangler tittel]"),
    description,
    "sponsors": coalesce(sponsors[] {
        _key,
        "title": coalesce(title, "[Mangler sponsornavn]"),
        website,
        "logoUrl": logo.asset->url,
        "logoAlt": coalesce(logo.alt, title),
        description[] ${portableTextProjection}
    }, [])
}`)

export const groupsPageQuery =
  defineQuery(`*[_type == "groupsPage" && _id == "groupsPage"][0] {
    eyebrow,
    "title": coalesce(title, "[Mangler tittel]"),
    description,
    "sections": coalesce(sections[] ${editorialSectionProjection}, []),
    "faq": coalesce(faq[] {
        _key,
        "question": coalesce(question, "[Mangler spørsmål]"),
        "answer": coalesce(answer, [])
    }, [])
}`)

export const pageSlugsQuery = defineQuery(`*[
    _type == "page"
    && defined(slug.current)
    && !(slug.current in ["arrangementer", "grupper", "karaoke", "kontakt", "rom", "sponsorer"])
  ] {
    "slug": slug.current
}`)

export const pageBySlugQuery = defineQuery(`*[
    _type == "page"
    && slug.current == $slug
    && !(slug.current in ["arrangementer", "grupper", "karaoke", "kontakt", "rom", "sponsorer"])
  ][0] {
    _id,
    "title": coalesce(title, "[Mangler tittel]"),
    "slug": coalesce(slug.current, ""),
    content
}`)

export const kontaktPageQuery =
  defineQuery(`*[_type == "kontaktPage" && _id == "kontaktPage"][0] {
    visitAddress,
    postAddress,
    invoiceAddress,
    invoiceEmail,
    ehf,
    generalContact,
    pressContact,
    "contactGroups": coalesce(contactGroups[] {
        _key,
        "title": coalesce(title, "[Mangler gruppenavn]"),
        "persons": coalesce(persons[] {
            _key,
            "name": coalesce(name, "[Mangler navn]"),
            rolle,
            email,
            phone,
            "imageUrl": image.asset->url
        }, [])
    }, [])
}`)

export const usefulInfoPageQuery =
  defineQuery(`*[_type == "usefulInfoPage" && _id == "usefulInfoPage"][0] {
    eyebrow,
    "title": coalesce(title, "Nyttig info"),
    intro,
    "sections": coalesce(sections[] {
        _type == "editorialSection" => ${editorialSectionProjection},
        _type == "infoAddressBlock" => ${infoAddressBlockProjection},
        _type == "infoAccordionBlock" => ${infoAccordionBlockProjection}
    }, [])
}`)

export const linkInBioQuery =
  defineQuery(`*[_type == "linkInBio" && _id == "linkInBio"][0] {
    "heading": coalesce(heading, "[Mangler overskrift]"),
    bio,
    "links": coalesce(links[] {
        _key,
        link ${sourceLinkProjection},
        emoji,
        "emojiImageUrl": emojiImage.asset->url,
        "highlight": coalesce(highlight, false)
    }, [])
}`)

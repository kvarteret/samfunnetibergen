import { defineQuery } from "next-sanity"
import { sourceLinkProjection } from "../fragments/links"
import { portableTextProjection } from "../fragments/portableText"
import { openingHoursProjection } from "../fragments/rooms"

const localizedEyebrow = `coalesce(localizedEyebrow[language == $locale && defined(value) && value != ""][0].value, localizedEyebrow[language == "nb" && defined(value) && value != ""][0].value, eyebrow)`
const localizedTitle = `coalesce(localizedTitle[language == $locale && defined(value) && value != ""][0].value, localizedTitle[language == "nb" && defined(value) && value != ""][0].value, title)`
const localizedDescription = `coalesce(localizedDescription[language == $locale && defined(value) && value != ""][0].value, localizedDescription[language == "nb" && defined(value) && value != ""][0].value, description)`
const localizedAnswer = `coalesce(localizedAnswer[language == $locale && defined(value) && value != ""][0].value, localizedAnswer[language == "nb" && defined(value) && value != ""][0].value, null)`
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
    "eyebrow": ${localizedEyebrow},
    "title": ${localizedTitle},
    "description": ${localizedDescription},
    primaryCta ${sourceLinkProjection}
}`)

export const roomsPageQuery =
  defineQuery(`*[_type == "roomsPage" && _id == "roomsPage"][0] {
    "eyebrow": ${localizedEyebrow},
    "title": coalesce(${localizedTitle}, "[Mangler tittel]"),
    "description": ${localizedDescription},
    "sections": coalesce(sections[] ${editorialSectionProjection}, []),
    bookingLink ${sourceLinkProjection}
}`)

export const sponsorsPageQuery =
  defineQuery(`*[_type == "sponsorsPage" && _id == "sponsorsPage"][0] {
    "eyebrow": ${localizedEyebrow},
    "title": coalesce(${localizedTitle}, "[Mangler tittel]"),
    "description": ${localizedDescription},
    "sponsors": coalesce(sponsors[] {
        _key,
        "title": coalesce(${localizedTitle}, "[Mangler sponsornavn]"),
        website,
        "logoUrl": logo.asset->url,
        "logoAlt": coalesce(localizedLogoAlt[language == $locale && defined(value) && value != ""][0].value, localizedLogoAlt[language == "nb" && defined(value) && value != ""][0].value, logo.alt, ${localizedTitle}),
        "description": coalesce(coalesce(localizedDescription[language == $locale && defined(value) && value != ""][0].value, localizedDescription[language == "nb" && defined(value) && value != ""][0].value, description, [])[] ${portableTextProjection}, [])
    }, [])
}`)

export const groupsPageQuery =
  defineQuery(`*[_type == "groupsPage" && _id == "groupsPage"][0] {
    "eyebrow": ${localizedEyebrow},
    "title": ${localizedTitle},
    "description": ${localizedDescription},
    "hasEnglishTranslation": defined(localizedEyebrow[language == "en" && defined(value) && value != ""][0].value) && defined(localizedTitle[language == "en" && defined(value) && value != ""][0].value) && defined(localizedDescription[language == "en" && defined(value) && value != ""][0].value),
    "sections": coalesce(sections[] ${editorialSectionProjection}, []),
    "faq": coalesce(faq[] {
        _key,
        "hasEnglishTranslation": defined(localizedQuestion[language == "en" && defined(value) && value != ""][0].value) && defined(localizedAnswer[language == "en" && defined(value) && value != ""][0].value),
        "question": coalesce(localizedQuestion[language == $locale && defined(value) && value != ""][0].value, localizedQuestion[language == "nb" && defined(value) && value != ""][0].value, question, "[Mangler spørsmål]"),
        "answer": select(
          defined(${localizedAnswer}) => string::split(${localizedAnswer}, "\n"),
          coalesce(answer, [])
        )
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
    "title": coalesce(${localizedTitle}, "[Mangler tittel]"),
    "slug": coalesce(slug.current, ""),
    "content": coalesce(localizedContent[language == $locale && defined(value) && value != ""][0].value, localizedContent[language == "nb" && defined(value) && value != ""][0].value, content, "")
}`)

export const kontaktPageQuery =
  defineQuery(`*[_type == "kontaktPage" && _id == "kontaktPage"][0] {
    "visitAddress": coalesce(localizedVisitAddress[language == $locale && defined(value) && value != ""][0].value, localizedVisitAddress[language == "nb" && defined(value) && value != ""][0].value, visitAddress),
    "postAddress": coalesce(localizedPostAddress[language == $locale && defined(value) && value != ""][0].value, localizedPostAddress[language == "nb" && defined(value) && value != ""][0].value, postAddress),
    "invoiceAddress": coalesce(localizedInvoiceAddress[language == $locale && defined(value) && value != ""][0].value, localizedInvoiceAddress[language == "nb" && defined(value) && value != ""][0].value, invoiceAddress),
    invoiceEmail,
    ehf,
    "generalContact": coalesce(localizedGeneralContact[language == $locale && defined(value) && value != ""][0].value, localizedGeneralContact[language == "nb" && defined(value) && value != ""][0].value, generalContact),
    "pressContact": coalesce(localizedPressContact[language == $locale && defined(value) && value != ""][0].value, localizedPressContact[language == "nb" && defined(value) && value != ""][0].value, pressContact),
    "contactGroups": coalesce(contactGroups[] {
        _key,
        "title": coalesce(localizedTitle[language == $locale && defined(value) && value != ""][0].value, localizedTitle[language == "nb" && defined(value) && value != ""][0].value, title, "[Mangler gruppenavn]"),
        "persons": coalesce(persons[] {
            _key,
            "name": coalesce(localizedName[language == $locale && defined(value) && value != ""][0].value, localizedName[language == "nb" && defined(value) && value != ""][0].value, name, "[Mangler navn]"),
            "rolle": coalesce(localizedRole[language == $locale && defined(value) && value != ""][0].value, localizedRole[language == "nb" && defined(value) && value != ""][0].value, rolle),
            email,
            phone,
            "imageUrl": image.asset->url
        }, [])
    }, [])
}`)

export const usefulInfoPageQuery =
  defineQuery(`*[_type == "usefulInfoPage" && _id == "usefulInfoPage"][0] {
    "eyebrow": ${localizedEyebrow},
    "title": coalesce(${localizedTitle}, "Nyttig info"),
    "intro": coalesce(localizedIntro[language == $locale && defined(value) && value != ""][0].value, localizedIntro[language == "nb" && defined(value) && value != ""][0].value, intro),
    "sections": coalesce(sections[] {
        _type == "editorialSection" => ${editorialSectionProjection},
        _type == "infoAddressBlock" => ${infoAddressBlockProjection},
        _type == "infoAccordionBlock" => ${infoAccordionBlockProjection}
    }, [])
}`)

export const linkInBioQuery =
  defineQuery(`*[_type == "linkInBio" && _id == "linkInBio"][0] {
    "heading": coalesce(localizedHeading[language == $locale && defined(value) && value != ""][0].value, localizedHeading[language == "nb" && defined(value) && value != ""][0].value, heading, "[Mangler overskrift]"),
    "bio": coalesce(localizedBio[language == $locale && defined(value) && value != ""][0].value, localizedBio[language == "nb" && defined(value) && value != ""][0].value, bio),
    "links": coalesce(links[] {
        _key,
        link ${sourceLinkProjection},
        emoji,
        "emojiImageUrl": emojiImage.asset->url,
        "highlight": coalesce(highlight, false)
    }, [])
}`)

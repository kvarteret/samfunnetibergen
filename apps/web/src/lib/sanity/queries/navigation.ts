import { defineQuery } from "next-sanity"

import { openingHoursProjection } from "../fragments/rooms"

// Anonymous object: always returns data regardless of whether the footer doc exists.
export const footerQuery = defineQuery(`{
    "socialLinks": coalesce(*[_type == "footer" && _id == "footer"][0].socialLinks[] {
        _key,
        "platform": coalesce(platform, "website"),
        "label": coalesce(localizedLabel[language == $locale && defined(value) && value != ""][0].value, localizedLabel[language == "nb" && defined(value) && value != ""][0].value, "[Mangler navn]"),
        "url": coalesce(url, "#")
    }, []),
    "visitAddress": coalesce(*[_type == "kontaktPage" && _id == "kontaktPage"][0].localizedVisitAddress[language == $locale && defined(value) && value != ""][0].value, *[_type == "kontaktPage" && _id == "kontaktPage"][0].localizedVisitAddress[language == "nb" && defined(value) && value != ""][0].value),
    "generalContact": coalesce(*[_type == "kontaktPage" && _id == "kontaktPage"][0].localizedGeneralContact[language == $locale && defined(value) && value != ""][0].value, *[_type == "kontaktPage" && _id == "kontaktPage"][0].localizedGeneralContact[language == "nb" && defined(value) && value != ""][0].value),
    "houseClosedDates": coalesce(*[_type == "siteMetadata" && _id == "siteMetadata"][0].houseClosedDates[] {
        _key,
        "date": coalesce(date, ""),
        note
    }, []),
    "vacationMode": {
        "enabled": coalesce(*[_type == "siteMetadata" && _id == "siteMetadata"][0].vacationMode.enabled, false),
        "from": *[_type == "siteMetadata" && _id == "siteMetadata"][0].vacationMode.from,
        "to": coalesce(
            *[_type == "siteMetadata" && _id == "siteMetadata"][0].vacationMode.to,
            *[_type == "siteMetadata" && _id == "siteMetadata"][0].vacationMode.reopensAt
        )
    },
    "operationsManagerHours": *[_type == "siteMetadata" && _id == "siteMetadata"][0].openingHours ${openingHoursProjection},
    "roomHours": coalesce(*[_type == "room" && slug.current in ["grondahls", "stjernesalen"]] | order(title asc) {
        "title": coalesce(localizedTitle[language == $locale && defined(value) && value != ""][0].value, localizedTitle[language == "nb" && defined(value) && value != ""][0].value, "[Mangler romnavn]"),
        "slug": coalesce(slug.current, ""),
        "hours": openingHours ${openingHoursProjection}
    }, [])
}`)

export const navbarQuery =
  defineQuery(`*[_type == "navbar" && _id == "navbar"][0] {
    "items": coalesce(items[] {
        _key,
                "label": coalesce(localizedLabel[language == $locale && defined(value) && value != ""][0].value, localizedLabel[language == "nb" && defined(value) && value != ""][0].value, "[Mangler navn]"),
        href,
        externalUrl,
        "children": coalesce(children[] {
            _key,
            "groupLabel": coalesce(localizedGroupLabel[language == $locale && defined(value) && value != ""][0].value, localizedGroupLabel[language == "nb" && defined(value) && value != ""][0].value),
            "items": coalesce(items[] {
                _key,
                    "label": coalesce(localizedLabel[language == $locale && defined(value) && value != ""][0].value, localizedLabel[language == "nb" && defined(value) && value != ""][0].value, "[Mangler navn]"),
                href,
                externalUrl
            }, [])
        }, [])
    }, [])
}`)

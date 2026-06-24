import { defineQuery } from "next-sanity"

import { openingHoursProjection } from "../fragments/rooms"

// Anonymous object: always returns data regardless of whether the footer doc exists.
export const footerQuery = defineQuery(`{
    "socialLinks": coalesce(*[_type == "footer" && _id == "footer"][0].socialLinks[] {
        _key,
        "platform": coalesce(platform, "website"),
        "label": coalesce(label, "[Mangler navn]"),
        "url": coalesce(url, "#")
    }, []),
    "visitAddress": *[_type == "kontaktPage" && _id == "kontaktPage"][0].visitAddress,
    "generalContact": *[_type == "kontaktPage" && _id == "kontaktPage"][0].generalContact,
    "houseClosedDates": coalesce(*[_type == "siteMetadata" && _id == "siteMetadata"][0].houseClosedDates[] {
        _key,
        "date": coalesce(date, ""),
        note
    }, []),
    "roomHours": coalesce(*[_type == "room" && slug.current in ["grondahls", "stjernesalen"]] | order(title asc) {
        "title": coalesce(title, "[Mangler romnavn]"),
        "slug": coalesce(slug.current, ""),
        "hours": openingHours ${openingHoursProjection}
    }, [])
}`)

export const navbarQuery =
  defineQuery(`*[_type == "navbar" && _id == "navbar"][0] {
    "items": coalesce(items[] {
        _key,
        "label": coalesce(label, "[Mangler navn]"),
        href,
        externalUrl,
        "children": coalesce(children[] {
            _key,
            groupLabel,
            "items": coalesce(items[] {
                _key,
                "label": coalesce(label, "[Mangler navn]"),
                href,
                externalUrl
            }, [])
        }, [])
    }, [])
}`)

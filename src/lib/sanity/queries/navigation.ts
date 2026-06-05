import { defineQuery } from "next-sanity"

import { openingHoursProjection } from "../fragments/rooms"

// Anonymous object: always returns data regardless of whether the footer doc exists.
export const footerQuery = defineQuery(`{
    "socialLinks": *[_type == "footer" && _id == "footer"][0].socialLinks[] {
        _key,
        platform,
        label,
        url
    },
    "visitAddress": *[_type == "kontaktPage" && _id == "kontaktPage"][0].visitAddress,
    "generalContact": *[_type == "kontaktPage" && _id == "kontaktPage"][0].generalContact,
    "houseClosedDates": *[_type == "siteMetadata" && _id == "siteMetadata"][0].houseClosedDates[] {
        _key,
        date,
        note
    },
    "roomHours": *[_type == "room" && slug.current in ["grondahls", "stjernesalen"]] | order(title asc) {
        "title": coalesce(title, ""),
        "slug": slug.current,
        "hours": openingHours ${openingHoursProjection}
    }
}`)

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

import { defineQuery } from "next-sanity"

import { sourcedImageProjection } from "../fragments/images"
import { sourceLinkProjection } from "../fragments/links"
import { portableTextProjection } from "../fragments/portableText"
import { openingHoursProjection } from "../fragments/rooms"

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
    panoramaUrl,
    hasSound,
    hasLighting,
    hasAV,
    specsUrl,
    "openingHours": openingHours ${openingHoursProjection},
    body[] ${portableTextProjection},
    "images": images[] ${sourcedImageProjection},
    "bookingLink": *[_type == "roomsPage" && _id == "roomsPage"][0].bookingLink ${sourceLinkProjection}
}`)

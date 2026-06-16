import { defineQuery } from "next-sanity"

import { sourcedImageProjection } from "../fragments/images"
import { sourceLinkProjection } from "../fragments/links"
import { portableTextProjection } from "../fragments/portableText"
import { openingHoursProjection } from "../fragments/rooms"

export const roomsQuery =
  defineQuery(`*[_type == "room"] | order(orderRank asc) {
    "title": coalesce(title, "[Mangler romnavn]"),
    "slug": coalesce(slug.current, ""),
    "summary": coalesce(summary, "[Mangler kort beskrivelse]"),
    seoTitle,
    seoDescription,
    canonicalUrl,
    "noIndex": coalesce(noIndex, false),
    "noFollow": coalesce(noFollow, false),
    openGraphTitle,
    openGraphDescription,
    "openGraphImageUrl": openGraphImage.asset->url,
    openGraphImageAlt,
    capacityStanding,
    capacitySeated,
    "suitedPurposes": coalesce(suitedPurposes, []),
    floor,
    bar,
    "hasSound": coalesce(hasSound, false),
    soundDetails,
    "hasLighting": coalesce(hasLighting, false),
    lightingDetails,
    "hasAV": coalesce(hasAV, false),
    avDetails,
    "image": images[0] ${sourcedImageProjection}
}`)

export const barPreviewsQuery = defineQuery(`{
    "houseClosedDates": coalesce(*[_type == "siteMetadata" && _id == "siteMetadata"][0].houseClosedDates[] {
        _key,
        "date": coalesce(date, ""),
        note
    }, []),
    "rooms": coalesce(*[_type == "room" && slug.current in ["stjernesalen", "grondahls"]] | order(title asc) {
        "title": coalesce(title, "[Mangler romnavn]"),
        "slug": coalesce(slug.current, ""),
        "summary": coalesce(summary, "[Mangler kort beskrivelse]"),
        bar,
        "openingHours": openingHours ${openingHoursProjection},
        "image": images[0] ${sourcedImageProjection}
    }, [])
}`)

export const roomSlugsQuery =
  defineQuery(`*[_type == "room" && defined(slug.current) && noIndex != true] {
    "slug": slug.current
}`)

export const bookableRoomsQuery =
  defineQuery(`*[_type == "room" && defined(crescatRoomId) && defined(slug.current)] | order(orderRank asc) {
    "title": coalesce(title, "[Mangler romnavn]"),
    "slug": coalesce(slug.current, ""),
    "summary": coalesce(summary, "[Mangler kort beskrivelse]"),
    capacityStanding,
    capacitySeated,
    crescatRoomId,
    "openingHours": openingHours ${openingHoursProjection},
    "image": images[0] ${sourcedImageProjection}
}`)

export const roomBySlugQuery =
  defineQuery(`*[_type == "room" && slug.current == $slug][0] {
    crescatRoomId,
    "title": coalesce(title, "[Mangler romnavn]"),
    "slug": coalesce(slug.current, ""),
    "summary": coalesce(summary, "[Mangler kort beskrivelse]"),
    seoTitle,
    seoDescription,
    canonicalUrl,
    "noIndex": coalesce(noIndex, false),
    "noFollow": coalesce(noFollow, false),
    openGraphTitle,
    openGraphDescription,
    "openGraphImageUrl": openGraphImage.asset->url,
    openGraphImageAlt,
    capacityStanding,
    capacitySeated,
    "suitedPurposes": coalesce(suitedPurposes, []),
    floor,
    bar,
    panoramaUrl,
    "hasSound": coalesce(hasSound, false),
    soundDetails,
    "hasLighting": coalesce(hasLighting, false),
    lightingDetails,
    "hasAV": coalesce(hasAV, false),
    avDetails,
    specsUrl,
    "openingHours": openingHours ${openingHoursProjection},
    "body": coalesce(body[] ${portableTextProjection}, []),
    "images": coalesce(images[] ${sourcedImageProjection}, []),
    "floorPlans": coalesce(*[_type == "roomsPage" && _id == "roomsPage"][0].floorPlans[] {
        _key,
        "floor": coalesce(floor, 0),
        "title": coalesce(title, "[Mangler tittel]"),
        "assetUrl": file.asset->url,
        "mimeType": file.asset->mimeType,
        "originalFilename": file.asset->originalFilename
    }, []),
    "bookingLink": *[_type == "roomsPage" && _id == "roomsPage"][0].bookingLink ${sourceLinkProjection}
}`)

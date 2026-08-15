import { defineQuery } from "next-sanity"

import { sourcedImageProjection } from "../fragments/images"
import { sourceLinkProjection } from "../fragments/links"
import { portableTextProjection } from "../fragments/portableText"
import { openingHoursProjection } from "../fragments/rooms"

const localizedRoomTitle = `coalesce(localizedTitle[language == $locale && defined(value) && value != ""][0].value, localizedTitle[language == "nb" && defined(value) && value != ""][0].value, "[Mangler romnavn]")`
const localizedRoomSummary = `coalesce(localizedSummary[language == $locale && defined(value) && value != ""][0].value, localizedSummary[language == "nb" && defined(value) && value != ""][0].value, "[Mangler kort beskrivelse]")`
const localizedRoomBody = `coalesce(localizedBody[language == $locale && defined(value) && value != ""][0].value, localizedBody[language == "nb" && defined(value) && value != ""][0].value, [])`
const localizedSoundDetails = `coalesce(localizedSoundDetails[language == $locale && defined(value) && value != ""][0].value, localizedSoundDetails[language == "nb" && defined(value) && value != ""][0].value)`
const localizedLightingDetails = `coalesce(localizedLightingDetails[language == $locale && defined(value) && value != ""][0].value, localizedLightingDetails[language == "nb" && defined(value) && value != ""][0].value)`
const localizedAvDetails = `coalesce(localizedAvDetails[language == $locale && defined(value) && value != ""][0].value, localizedAvDetails[language == "nb" && defined(value) && value != ""][0].value)`
const localizedBar = `coalesce(localizedBar[language == $locale && defined(value) && value != ""][0].value, localizedBar[language == "nb" && defined(value) && value != ""][0].value)`
const localizedSuitedPurposes = `coalesce(string::split(localizedSuitedPurposes[language == $locale && defined(value) && value != ""][0].value, "\\n"), string::split(localizedSuitedPurposes[language == "nb" && defined(value) && value != ""][0].value, "\\n"), [])`

export const roomsQuery =
  defineQuery(`*[_type == "room"] | order(orderRank asc) {
    "title": ${localizedRoomTitle},
    "slug": coalesce(slug.current, ""),
    "summary": ${localizedRoomSummary},
    capacityStanding,
    capacitySeated,
    "suitedPurposes": ${localizedSuitedPurposes},
    floor,
    "bar": ${localizedBar},
    "hasSound": coalesce(hasSound, false),
    "soundDetails": ${localizedSoundDetails},
    "hasLighting": coalesce(hasLighting, false),
    "lightingDetails": ${localizedLightingDetails},
    "hasAV": coalesce(hasAV, false),
    "avDetails": ${localizedAvDetails},
    "image": images[0] ${sourcedImageProjection}
}`)

export const barPreviewsQuery = defineQuery(`{
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
    "rooms": coalesce(*[_type == "room" && slug.current in ["stjernesalen", "grondahls"]] | order(title asc) {
        "title": ${localizedRoomTitle},
        "slug": coalesce(slug.current, ""),
        "summary": ${localizedRoomSummary},
        "bar": ${localizedBar},
        "openingHours": openingHours ${openingHoursProjection},
        "image": images[0] ${sourcedImageProjection}
    }, [])
}`)

export const roomSlugsQuery =
  defineQuery(`*[_type == "room" && defined(slug.current)] {
    "slug": slug.current
}`)

export const bookableRoomsQuery =
  defineQuery(`*[_type == "room" && defined(crescatRoomId) && defined(slug.current)] | order(orderRank asc) {
    "title": ${localizedRoomTitle},
    "slug": coalesce(slug.current, ""),
    "summary": ${localizedRoomSummary},
    capacityStanding,
    capacitySeated,
    crescatRoomId,
    pricePerHour,
    floor,
    "suitedPurposes": ${localizedSuitedPurposes},
    "bar": ${localizedBar},
    "openingHours": openingHours ${openingHoursProjection},
    "image": images[0] ${sourcedImageProjection},
    "hasSound": coalesce(hasSound, false),
    "soundDetails": ${localizedSoundDetails},
    "hasLighting": coalesce(hasLighting, false),
    "lightingDetails": ${localizedLightingDetails},
    "hasAV": coalesce(hasAV, false),
    "avDetails": ${localizedAvDetails}
}`)

export const roomBySlugQuery =
  defineQuery(`*[_type == "room" && slug.current == $slug][0] {
    crescatRoomId,
    "title": ${localizedRoomTitle},
    "slug": coalesce(slug.current, ""),
    "summary": ${localizedRoomSummary},
    capacityStanding,
    capacitySeated,
    "suitedPurposes": ${localizedSuitedPurposes},
    floor,
    "bar": ${localizedBar},
    pricePerHour,
    panoramaUrl,
    "hasSound": coalesce(hasSound, false),
    "soundDetails": ${localizedSoundDetails},
    "hasLighting": coalesce(hasLighting, false),
    "lightingDetails": ${localizedLightingDetails},
    "hasAV": coalesce(hasAV, false),
    "avDetails": ${localizedAvDetails},
    specsUrl,
    "openingHours": openingHours ${openingHoursProjection},
    "body": coalesce(${localizedRoomBody}[] ${portableTextProjection}, []),
    "images": coalesce(images[] ${sourcedImageProjection}, []),
    "floorPlans": coalesce(*[_type == "roomsPage" && _id == "roomsPage"][0].floorPlans[] {
        _key,
        "floor": coalesce(floor, 0),
        "title": coalesce(localizedTitle[language == $locale && defined(value) && value != ""][0].value, localizedTitle[language == "nb" && defined(value) && value != ""][0].value, "[Mangler tittel]"),
        "assetUrl": file.asset->url,
        "mimeType": file.asset->mimeType,
        "originalFilename": file.asset->originalFilename
    }, []),
    "bookingLink": *[_type == "roomsPage" && _id == "roomsPage"][0].bookingLink ${sourceLinkProjection}
}`)

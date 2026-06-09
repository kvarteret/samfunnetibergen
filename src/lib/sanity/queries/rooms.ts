import { defineQuery } from "next-sanity";

import { sourcedImageProjection } from "../fragments/images";
import { sourceLinkProjection } from "../fragments/links";
import { portableTextProjection } from "../fragments/portableText";
import { openingHoursProjection } from "../fragments/rooms";

export const roomsQuery =
  defineQuery(`*[_type == "room"] | order(orderRank asc) {
    title,
    "slug": slug.current,
    summary,
    capacityStanding,
    capacitySeated,
    suitedPurposes,
    floor,
    bar,
    hasSound,
    soundDetails,
    hasLighting,
    lightingDetails,
    hasAV,
    avDetails,
    "image": images[0] ${sourcedImageProjection}
}`);

export const barPreviewsQuery = defineQuery(`{
    "houseClosedDates": *[_type == "siteMetadata" && _id == "siteMetadata"][0].houseClosedDates[] {
        _key,
        date,
        note
    },
    "rooms": *[_type == "room" && slug.current in ["stjernesalen", "grondahls"]] | order(title asc) {
        "title": coalesce(title, ""),
        "slug": slug.current,
        summary,
        bar,
        "openingHours": openingHours ${openingHoursProjection},
        "image": images[0] ${sourcedImageProjection}
    }
}`);

export const roomSlugsQuery =
  defineQuery(`*[_type == "room" && defined(slug.current)] {
    "slug": slug.current
}`);

export const bookableRoomsQuery =
  defineQuery(`*[_type == "room" && defined(crescatRoomId) && defined(slug.current)] | order(orderRank asc) {
    title,
    "slug": slug.current,
    summary,
    capacityStanding,
    capacitySeated,
    crescatRoomId,
    "openingHours": openingHours ${openingHoursProjection},
    "image": images[0] ${sourcedImageProjection}
}`);

export const roomBySlugQuery =
  defineQuery(`*[_type == "room" && slug.current == $slug][0] {
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
    soundDetails,
    hasLighting,
    lightingDetails,
    hasAV,
    avDetails,
    specsUrl,
    "openingHours": openingHours ${openingHoursProjection},
    body[] ${portableTextProjection},
    "images": images[] ${sourcedImageProjection},
    "floorPlans": *[_type == "roomsPage" && _id == "roomsPage"][0].floorPlans[] {
        _key,
        floor,
        title,
        "assetUrl": file.asset->url,
        "mimeType": file.asset->mimeType,
        "originalFilename": file.asset->originalFilename
    },
    "bookingLink": *[_type == "roomsPage" && _id == "roomsPage"][0].bookingLink ${sourceLinkProjection}
}`);

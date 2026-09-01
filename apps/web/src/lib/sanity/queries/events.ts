import { defineQuery } from "next-sanity"

import { portableTextProjection } from "../fragments/portableText"

const localizedName = `coalesce(localizedName[language == $locale && defined(value) && value != ""][0].value, localizedName[language == "nb" && defined(value) && value != ""][0].value, "")`
const localizedTitle = `coalesce(localizedTitle[language == $locale && defined(value) && value != ""][0].value, localizedTitle[language == "nb" && defined(value) && value != ""][0].value, "")`
const localizedNullableTitle = `coalesce(localizedTitle[language == $locale && defined(value) && value != ""][0].value, localizedTitle[language == "nb" && defined(value) && value != ""][0].value)`
const localizedDescription = `coalesce(localizedDescription[language == $locale && defined(value) && value != ""][0].value, localizedDescription[language == "nb" && defined(value) && value != ""][0].value, [])`
const localizedNullableImageCaption = `coalesce(localizedImageCaption[language == $locale && defined(value) && value != ""][0].value, localizedImageCaption[language == "nb" && defined(value) && value != ""][0].value)`
const localizedNullableOrganizerText = `coalesce(localizedOrganizerText[language == $locale && defined(value) && value != ""][0].value, localizedOrganizerText[language == "nb" && defined(value) && value != ""][0].value)`
const localizedNullableRoomText = `coalesce(localizedRoomText[language == $locale && defined(value) && value != ""][0].value, localizedRoomText[language == "nb" && defined(value) && value != ""][0].value)`

export const eventRoomsQuery = defineQuery(`
    *[_type == "room"] | order(orderRank asc) {
    _id,
    "title": ${localizedTitle},
    "slug": coalesce(slug.current, "")
}`)

export const eventTypesQuery = defineQuery(`
    *[_type == "eventType" && isActive != false] | order(taxonomyGroup->orderRank asc, orderRank asc, ${localizedName} asc) {
    _id,
    "name": ${localizedName},
    "taxonomyGroup": taxonomyGroup-> {
        _id,
        "name": ${localizedName}
    }
}`)

export const eventGroupsQuery = defineQuery(`
    *[_type == "studentGroup"] | order(orderRank asc, ${localizedName} asc) {
    _id,
    "name": ${localizedName},
    "category": coalesce(category, "")
}`)

// ADR 005 query contract: a missing eventKind always reads as "single";
// public listings and feeds show concrete events only (never parents).
const CONCRETE_EVENT_KINDS = `coalesce(eventKind, "single") in ["single", "seriesInstance", "festivalSession"]`
const PARENT_EVENT_KINDS = `coalesce(eventKind, "single") in ["seriesParent", "festivalParent"]`

// Inheritable fields are projected raw (no coalesce): a null child value
// must survive to the domain resolver so it can fall back to the parent.
// Display defaults are applied after resolution in the public event domain.
const inheritableFieldsProjection = `
    "title": ${localizedNullableTitle},
    "description": ${localizedDescription}[] ${portableTextProjection},
    "imageUrl": image.asset->url,
    "imageCaption": ${localizedNullableImageCaption},
    "organizerGroup": organizerGroup-> { _id, "name": ${localizedName}, "slug": coalesce(slug.current, "") },
    "organizerText": ${localizedNullableOrganizerText},
    "eventType": eventType-> {
        _id,
        "name": ${localizedName},
        "taxonomyGroup": taxonomyGroup-> { _id, "name": ${localizedName} }
    },
    isFree,
    priceOrdinar,
    priceStudent,
    priceMedlem,
    ticketUrl,
    facebookUrl,
    isInternalEvent`

export const publishedEventSlugsQuery = defineQuery(`
    *[
        _type == "arrangement"
        && approvalStatus == "approved"
        && defined(slug.current)
        && ${CONCRETE_EVENT_KINDS}
        && coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true
        && (
            count(dates[startDate >= $today]) > 0
            || eventStatus == "cancelled"
        )
    ] {
        "slug": slug.current
    }`)

// Public pages, API routes, feeds, and editor preview share this projection.
const PUBLIC_DATE_FILTER = `defined(startDate) && ($from == null || startDate >= $from) && ($to == null || startDate <= $to)`

const publicParentProjection = `parentEvent-> {
    _id,
    _updatedAt,
    "slug": coalesce(slug.current, ""),
    "eventKind": coalesce(eventKind, "single"),
    eventStatus,
    ${inheritableFieldsProjection}
}`

const publicEventProjection = `{
    _id,
    _updatedAt,
    "eventKind": coalesce(eventKind, "single"),
    eventStatus,
    "isPromoted": coalesce(isPromoted, false),
    promotedPlacement,
    promotedOrder,
    orderRank,
    "isRecurring": coalesce(isRecurring, false),
    rrule,
    "useFestivalImage": coalesce(useFestivalImage, true),
    "parent": ${publicParentProjection},
    "slug": coalesce(slug.current, ""),
    "dates": coalesce(select(
      eventKind in ["seriesParent", "festivalParent"] => *[
        _type == "arrangement" &&
        eventKind in ["seriesInstance", "festivalSession"] &&
        parentEvent._ref == ^._id &&
        approvalStatus == "approved" &&
        ($includeInternal == true || coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true)
      ].dates[${PUBLIC_DATE_FILTER}][] | order(startDate asc, startTime asc) {
        _key,
        "startDate": coalesce(startDate, ""),
        startTime,
        endTime
      },
      dates[${PUBLIC_DATE_FILTER}][] | order(startDate asc, startTime asc) {
        _key,
        "startDate": coalesce(startDate, ""),
        startTime,
        endTime
      }
    ), []),
    "room": room-> {
        _id,
        "title": ${localizedTitle},
        "slug": coalesce(slug.current, ""),
        floor,
        "imageUrl": images[0].image.asset->url
    },
    "roomText": ${localizedNullableRoomText},
    ${inheritableFieldsProjection}
}`

/** Approved concrete events whose dates overlap the requested inclusive range. */
export const publicEventsQuery = defineQuery(`
    *[
        _type == "arrangement"
        && approvalStatus == "approved"
        && ${CONCRETE_EVENT_KINDS}
        && defined(slug.current)
        && count(dates[${PUBLIC_DATE_FILTER}]) > 0
        && ($includeInternal == true || coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true)
    ] | order(dates[${PUBLIC_DATE_FILTER}][0].startDate asc, dates[${PUBLIC_DATE_FILTER}][0].startTime asc, _id asc) ${publicEventProjection}`)

/** Promoted public parents used by the homepage feature surface. */
export const publicPromotedParentEventsQuery = defineQuery(`
    *[
        _type == "arrangement"
        && approvalStatus == "approved"
        && isPromoted == true
        && ${PARENT_EVENT_KINDS}
        && count(*[
          _type == "arrangement"
          && eventKind in ["seriesInstance", "festivalSession"]
          && parentEvent._ref == ^._id
          && approvalStatus == "approved"
          && count(dates[${PUBLIC_DATE_FILTER}]) > 0
          && ($includeInternal == true || coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true)
        ]) > 0
        && ($includeInternal == true || coalesce(isInternalEvent, false) != true)
    ] | order(promotedOrder asc, orderRank asc, _id asc) ${publicEventProjection}`)

/** Approved event lookup for the public API, including historical records. */
export const publicEventBySlugQuery = defineQuery(`
    *[
        _type == "arrangement"
        && slug.current == $slug
        && approvalStatus == "approved"
        && ($includeInternal == true || coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true)
    ][0] ${publicEventProjection}`)

/** Approved child events for a public series/festival program. */
export const publicEventChildrenQuery = defineQuery(`
    *[
        _type == "arrangement"
        && parentEvent._ref == $parentId
        && approvalStatus == "approved"
        && coalesce(eventKind, "single") in ["seriesInstance", "festivalSession"]
        && defined(slug.current)
        && ($includeInternal == true || coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true)
    ] | order(dates[0].startDate asc, dates[0].startTime asc, _id asc) ${publicEventProjection}`)

// Editor preview uses the same projection while allowing the selected draft.
export const previewEventBySlugQuery = defineQuery(`
    *[
        _type == "arrangement"
        && slug.current == $slug
        && ($preview == true || approvalStatus == "approved")
    ][0] ${publicEventProjection}`)

export const previewEventChildrenQuery = defineQuery(`
    *[
        _type == "arrangement"
        && parentEvent._ref == $parentId
        && approvalStatus == "approved"
        && coalesce(eventKind, "single") in ["seriesInstance", "festivalSession"]
    ] | order(dates[0].startDate asc, dates[0].startTime asc, _id asc) ${publicEventProjection}`)

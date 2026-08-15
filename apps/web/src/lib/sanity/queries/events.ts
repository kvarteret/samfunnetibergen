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
    *[_type == "eventType" && isActive != false] | order(taxonomyGroup->orderRank asc, orderRank asc, name asc) {
    _id,
    "name": ${localizedName},
    "taxonomyGroup": taxonomyGroup-> {
        _id,
        "name": ${localizedName}
    }
}`)

export const eventGroupsQuery = defineQuery(`
    *[_type == "studentGroup"] | order(orderRank asc, name asc) {
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
// Display defaults are applied after resolution in apps/web/src/lib/sanity/fetch/events.ts.
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

const parentProjection = `parentEvent-> {
    _id,
    "slug": coalesce(slug.current, ""),
    "eventKind": coalesce(eventKind, "single"),
    eventStatus,
    ${inheritableFieldsProjection}
}`

const eventProjection = `{
    _id,
    "eventKind": coalesce(eventKind, "single"),
    eventStatus,
    "parent": ${parentProjection},
    "slug": coalesce(slug.current, ""),
    "approvalStatus": coalesce(approvalStatus, "pending"),
    "isPromoted": coalesce(isPromoted, false),
    promotedPlacement,
    promotedOrder,
    orderRank,
    "isRecurring": coalesce(isRecurring, false),
    "useFestivalImage": coalesce(useFestivalImage, true),
    rrule,
    "dates": coalesce(select(
      eventKind in ["seriesParent", "festivalParent"] => *[
        _type == "arrangement" &&
        eventKind in ["seriesInstance", "festivalSession"] &&
        parentEvent._ref == ^._id &&
        approvalStatus == "approved"
      ].dates[] | order(startDate asc, startTime asc) {
        _key,
        "startDate": coalesce(startDate, ""),
        startTime,
        endTime
      },
      dates[] | order(startDate asc) {
        _key,
        "startDate": coalesce(startDate, ""),
        startTime,
        endTime
      }
    ), []),
    "room": room-> { _id, "title": ${localizedTitle}, "slug": coalesce(slug.current, ""), floor, "imageUrl": images[0].image.asset->url },
    "roomText": ${localizedNullableRoomText},
    ${inheritableFieldsProjection}
}`

export const publishedEventsQuery = defineQuery(`
    *[
        _type == "arrangement"
        && approvalStatus == "approved"
        && ${CONCRETE_EVENT_KINDS}
        && count(dates[startDate >= $today]) > 0
    ] | order(coalesce(dates[startDate >= $today][0].startDate, dates[0].startDate) asc) ${eventProjection}`)

// Promoted parent events are fetched separately for homepage-style promoted
// surfaces. Normal listings and feeds still show only concrete events.
export const promotedParentEventsQuery = defineQuery(`
    *[
        _type == "arrangement"
        && approvalStatus == "approved"
        && isPromoted == true
        && ${PARENT_EVENT_KINDS}
        && count(*[
          _type == "arrangement" &&
          eventKind in ["seriesInstance", "festivalSession"] &&
          parentEvent._ref == ^._id &&
          approvalStatus == "approved" &&
          count(dates[startDate >= $today]) > 0
        ]) > 0
    ] | order(coalesce(dates[startDate >= $today][0].startDate, dates[0].startDate) asc) ${eventProjection}`)

export const publishedEventSlugsQuery = defineQuery(`
    *[
        _type == "arrangement"
        && approvalStatus == "approved"
        && defined(slug.current)
        && ${CONCRETE_EVENT_KINDS}
        && (
            count(dates[startDate >= $today]) > 0
            || eventStatus == "cancelled"
        )
    ] {
        "slug": slug.current
    }`)

// Detail pages stay reachable for every approved event, including historical
// events whose stable URLs may still be linked from search or social posts.
// Preview mode continues to expose drafts, while unpublished events remain
// unavailable to ordinary requests.
export const eventBySlugQuery = defineQuery(`
    *[_type == "arrangement" && slug.current == $slug && (
        $preview == true
        || (
            approvalStatus == "approved"
        )
    )][0] ${eventProjection}`)

export const eventChildrenQuery = defineQuery(`
    *[
        _type == "arrangement"
        && parentEvent._ref == $parentId
        && approvalStatus == "approved"
    ] | order(dates[0].startDate asc) ${eventProjection}`)

// The internal-event flag is inheritable, so the feed's exclusion must
// consider the parent's flag for children that never set their own.
// The $today date filter here trims payload; the structured-data builder
// filters by its own "today" again because cached query results can span a
// date boundary within the revalidation window.
export const feedEventsQuery = defineQuery(`
    *[
        _type == "arrangement"
        && approvalStatus == "approved"
        && coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true
        && ${CONCRETE_EVENT_KINDS}
        && count(dates[startDate >= $today]) > 0
    ] | order(coalesce(dates[startDate >= $today][0].startDate, dates[0].startDate) asc) {
        _id,
        _updatedAt,
        "eventKind": coalesce(eventKind, "single"),
        eventStatus,
        "parent": ${parentProjection},
        "slug": coalesce(slug.current, ""),
        "dates": coalesce(dates[startDate >= $today] | order(startDate asc) {
            _key,
            "startDate": coalesce(startDate, ""),
            startTime,
            endTime
        }, []),
        "room": room-> { "title": ${localizedTitle} },
        "roomText": ${localizedNullableRoomText},
        ${inheritableFieldsProjection}
    }`)

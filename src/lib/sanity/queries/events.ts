import { defineQuery } from "next-sanity"

import { portableTextProjection } from "../fragments/portableText"

export const eventsPageContentNbQuery =
  defineQuery(`*[_type == "eventsPage" && _id == "eventsPage"][0] {
    "eyebrow": coalesce(eyebrow, eyebrowNb),
    "title": coalesce(title, titleNb, "[Mangler tittel]"),
    "description": coalesce(description, descriptionNb)
}`)

export const eventRoomsQuery = defineQuery(`
    *[_type == "room"] | order(orderRank asc) {
    _id,
    "title": coalesce(title, ""),
    "slug": coalesce(slug.current, "")
}`)

export const eventTypesQuery = defineQuery(`
    *[_type == "eventType" && isActive != false] | order(taxonomyGroup->orderRank asc, orderRank asc, name asc) {
    _id,
    "name": coalesce(name, ""),
    "slug": coalesce(slug.current, ""),
    "taxonomyGroup": taxonomyGroup-> {
        _id,
        "name": coalesce(name, ""),
        "slug": coalesce(slug.current, "")
    }
}`)

export const eventGroupsQuery = defineQuery(`
    *[_type == "studentGroup"] | order(orderRank asc, name asc) {
    _id,
    "name": coalesce(name, ""),
    "category": coalesce(category, "")
}`)

// ADR 005 query contract: a missing eventKind always reads as "single";
// public listings and feeds show concrete events only (never parents).
const CONCRETE_EVENT_KINDS = `coalesce(eventKind, "single") in ["single", "seriesInstance", "festivalSession"]`
const PARENT_EVENT_KINDS = `coalesce(eventKind, "single") in ["seriesParent", "festivalParent"]`

// Inheritable fields are projected raw (no coalesce): a null child value
// must survive to the domain resolver so it can fall back to the parent.
// Display defaults are applied after resolution in src/lib/sanity/fetch/events.ts.
const inheritableFieldsProjection = `
    title,
    "description": description[] ${portableTextProjection},
    "imageUrl": image.asset->url,
    imageCaption,
    "organizerGroup": organizerGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") },
    organizerText,
    "eventType": eventType-> {
        _id,
        "name": coalesce(name, ""),
        "slug": coalesce(slug.current, ""),
        "taxonomyGroup": taxonomyGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") }
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
    "isRecurring": coalesce(isRecurring, false),
    rrule,
    "dates": coalesce(dates[] | order(startDate asc) {
        _key,
        "startDate": coalesce(startDate, ""),
        startTime,
        endTime
    }, []),
    "room": room-> { _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""), floor, "imageUrl": images[0].image.asset->url },
    roomText,
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
        && count(dates[startDate >= $today]) > 0
    ] | order(coalesce(dates[startDate >= $today][0].startDate, dates[0].startDate) asc) ${eventProjection}`)

export const publishedEventSlugsQuery = defineQuery(`
    *[
        _type == "arrangement"
        && approvalStatus == "approved"
        && defined(slug.current)
        && ${CONCRETE_EVENT_KINDS}
        && (
            count(dates[startDate >= $today]) > 0
            || eventStatus in ["cancelled", "postponed"]
        )
    ] {
        "slug": slug.current
    }`)

// Detail pages stay reachable for approved cancelled/postponed events
// (shared URLs must not 404 because the real-world status changed) and for
// series/festival parents, whose pages act as overviews.
export const eventBySlugQuery = defineQuery(`
    *[_type == "arrangement" && slug.current == $slug && (
        $preview == true
        || (
            approvalStatus == "approved"
            && (
                count(dates[startDate >= $today]) > 0
                || eventStatus in ["cancelled", "postponed"]
                || ${PARENT_EVENT_KINDS}
            )
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
        "dates": coalesce(dates[] | order(startDate asc) {
            _key,
            "startDate": coalesce(startDate, ""),
            startTime,
            endTime
        }, []),
        "room": room-> { "title": coalesce(title, "") },
        roomText,
        ${inheritableFieldsProjection}
    }`)

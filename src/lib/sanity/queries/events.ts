import { defineQuery } from "next-sanity"

import { portableTextProjection } from "../fragments/portableText"

export const eventsPageContentNbQuery =
  defineQuery(`*[_type == "eventsPage" && _id == "eventsPage"][0] {
    "eyebrow": coalesce(eyebrow, eyebrowNb),
    "title": coalesce(title, titleNb, "[Mangler tittel]"),
    "description": coalesce(description, descriptionNb),
    seoTitle,
    seoDescription,
    canonicalUrl,
    "noIndex": coalesce(noIndex, false),
    "noFollow": coalesce(noFollow, false),
    openGraphTitle,
    openGraphDescription,
    "openGraphImageUrl": openGraphImage.asset->url,
    openGraphImageAlt
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

const eventProjection = `{
    _id,
    "title": coalesce(title, "[Mangler arrangementstittel]"),
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
    "isFree": coalesce(isFree, false),
    priceOrdinar,
    priceStudent,
    priceMedlem,
    seoTitle,
    seoDescription,
    canonicalUrl,
    "noIndex": coalesce(noIndex, false),
    "noFollow": coalesce(noFollow, false),
    openGraphTitle,
    openGraphDescription,
    "openGraphImageUrl": openGraphImage.asset->url,
    openGraphImageAlt,
    ticketUrl,
    facebookUrl,
    "imageUrl": image.asset->url,
    imageCaption,
    "room": room-> { _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""), floor, "imageUrl": images[0].image.asset->url },
    roomText,
    "organizerGroup": organizerGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") },
    organizerText,
    "eventType": eventType-> {
        _id,
        "name": coalesce(name, ""),
        "slug": coalesce(slug.current, ""),
        "taxonomyGroup": taxonomyGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") }
    },
    "description": coalesce(description[] ${portableTextProjection}, [])
}`

export const publishedEventsQuery = defineQuery(`
    *[_type == "arrangement" && approvalStatus == "approved" && (
        count(dates[startDate >= $today]) > 0
        || (isRecurring == true && defined(rrule) && count(dates) > 0)
    )] | order(coalesce(dates[startDate >= $today][0].startDate, dates[0].startDate) asc) ${eventProjection}`)

export const publishedEventSlugsQuery = defineQuery(`
    *[
        _type == "arrangement"
        && approvalStatus == "approved"
        && noIndex != true
        && defined(slug.current)
        && (
            count(dates[startDate >= $today]) > 0
            || (isRecurring == true && defined(rrule) && count(dates) > 0)
        )
    ] {
        "slug": slug.current
    }`)

export const eventBySlugQuery = defineQuery(`
    *[_type == "arrangement" && slug.current == $slug && (
        $preview == true
        || (
            approvalStatus == "approved"
            && (
                count(dates[startDate >= $today]) > 0
                || (isRecurring == true && defined(rrule) && count(dates) > 0)
            )
        )
    )][0] ${eventProjection}`)

export const feedEventsQuery = defineQuery(`
    *[
        _type == "arrangement"
        && approvalStatus == "approved"
        && isInternalEvent != true
        && (
            count(dates[startDate >= $today]) > 0
            || (isRecurring == true && defined(rrule) && count(dates) > 0)
        )
    ] | order(coalesce(dates[startDate >= $today][0].startDate, dates[0].startDate) asc) {
        _id,
        _updatedAt,
        "title": coalesce(title, "[Mangler arrangementstittel]"),
        "slug": coalesce(slug.current, ""),
        "isRecurring": coalesce(isRecurring, false),
        rrule,
        "dates": coalesce(dates[] | order(startDate asc) {
            _key,
            "startDate": coalesce(startDate, ""),
            startTime,
            endTime
        }, []),
        "isFree": coalesce(isFree, false),
        priceOrdinar,
        priceStudent,
        ticketUrl,
        "imageUrl": image.asset->url,
        "room": room-> { "title": coalesce(title, "") },
        roomText,
        "organizerGroup": organizerGroup-> { "name": coalesce(name, "") },
        organizerText,
        "eventType": eventType-> { "name": coalesce(name, "") },
        "description": coalesce(description[] ${portableTextProjection}, [])
    }`)

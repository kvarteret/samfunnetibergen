import "server-only"

import type { EventStatistic } from "../domain/statistics"

/** Sanity fields the statistics views need; children inherit from parents. */
export type EventDocument = {
  _id: string
  eventKind: string | null
  parent: { _id: string; slug: string | null; title: string | null } | null
  slug: string | null
  initialSlug: string | null
  title: string | null
  dates: string[] | null
  imageUrl: string | null
  eventStatus: string | null
  isSoldOut: boolean | null
  hasTicketLink: boolean | null
  isPromoted: boolean | null
  hasFacebookLink: boolean | null
  organizer: { _id: string; slug: string | null; name: string | null } | null
  organizerText: string | null
  eventType: {
    _id: string
    name: string | null
    taxonomyGroup: { _id: string; name: string | null } | null
  } | null
}

export const EVENT_PROJECTION = `{
  _id,
  "eventKind": coalesce(eventKind, "single"),
  "parent": parentEvent->{
    _id,
    "slug": slug.current,
    "title": localizedTitle[language == "nb" && defined(value) && value != ""][0].value
  },
  "slug": slug.current,
  "initialSlug": coalesce(initialSlug, slug.current),
  "title": coalesce(
    localizedTitle[language == "nb" && defined(value) && value != ""][0].value,
    parentEvent->localizedTitle[language == "nb" && defined(value) && value != ""][0].value
  ),
  "dates": dates[].startDate,
  "imageUrl": coalesce(image.asset->url, parentEvent->image.asset->url),
  "eventStatus": select(
    eventStatus == "cancelled" || parentEvent->eventStatus == "cancelled" => "cancelled",
    "scheduled"
  ),
  "isSoldOut": coalesce(isSoldOut, parentEvent->isSoldOut, false),
  "hasTicketLink": defined(coalesce(ticketUrl, parentEvent->ticketUrl)),
  "isPromoted": coalesce(isPromoted, false),
  "hasFacebookLink": defined(coalesce(facebookUrl, parentEvent->facebookUrl)),
  "eventType": coalesce(eventType, parentEvent->eventType)->{
    _id,
    "name": localizedName[language == "nb" && defined(value) && value != ""][0].value,
    "taxonomyGroup": taxonomyGroup->{
      _id,
      "name": localizedName[language == "nb" && defined(value) && value != ""][0].value
    }
  },
  "organizer": coalesce(organizerGroup, parentEvent->organizerGroup)->{
    _id,
    "slug": slug.current,
    "name": localizedName[language == "nb" && defined(value) && value != ""][0].value
  },
  "organizerText": coalesce(
    localizedOrganizerText[language == "nb" && defined(value) && value != ""][0].value,
    parentEvent->localizedOrganizerText[language == "nb" && defined(value) && value != ""][0].value
  )
}`

export type EventMeta = Omit<
  EventStatistic,
  | "views"
  | "sessions"
  | "visitors"
  | "ticketClicks"
  | "facebookClicks"
  | "medianSeconds"
  | "instanceCount"
  | "daily"
  | "firstSeen"
>

const PARENT_KINDS = new Set(["seriesParent", "festivalParent"])

export function toEventMeta(doc: EventDocument): EventMeta {
  const slug = doc.slug ?? doc.initialSlug ?? doc._id
  const dates = (doc.dates ?? []).filter(Boolean).sort()
  return {
    id: doc._id,
    slug,
    series: doc.parent
      ? {
          id: doc.parent._id,
          slug: doc.parent.slug ?? doc.parent._id,
          title: doc.parent.title ?? doc.parent.slug ?? "Serie",
        }
      : PARENT_KINDS.has(doc.eventKind ?? "")
        ? { id: doc._id, slug, title: doc.title ?? slug }
        : null,
    title: doc.title ?? slug,
    organizerName: doc.organizer?.name ?? doc.organizerText ?? null,
    organizerSlug: doc.organizer?.slug ?? null,
    imageUrl: doc.imageUrl ?? null,
    organizerGroup:
      doc.organizer?.name != null
        ? { _id: doc.organizer._id, name: doc.organizer.name }
        : null,
    eventType:
      doc.eventType?.name != null
        ? {
            _id: doc.eventType._id,
            name: doc.eventType.name,
            taxonomyGroup:
              doc.eventType.taxonomyGroup?.name != null
                ? {
                    _id: doc.eventType.taxonomyGroup._id,
                    name: doc.eventType.taxonomyGroup.name,
                  }
                : null,
          }
        : null,
    firstDate: dates[0] ?? null,
    lastDate: dates.at(-1) ?? null,
    isCancelled: doc.eventStatus === "cancelled",
    isSoldOut: doc.isSoldOut === true,
    hasTicketLink: doc.hasTicketLink === true,
    isPromoted: doc.isPromoted === true,
    hasFacebookLink: doc.hasFacebookLink === true,
  }
}

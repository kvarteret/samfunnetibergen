import "server-only";

import type { ClientReturn } from "@sanity/client";
import type { AppLocale } from "@/i18n/routing";
import { sanityClient } from "../client";
import { sanityFetch } from "../fetcher";
import {
  eventBySlugQuery,
  eventGroupsQuery,
  eventRoomsQuery,
  eventsPageContentNbQuery,
  eventTypesQuery,
  publishedEventsQuery,
} from "../queries";
import { type FetchOptions, getOsloDateString } from "./shared";

export type EventsPageContent = NonNullable<
  ClientReturn<typeof eventsPageContentNbQuery>
>;

export type PublishedEvent = ClientReturn<typeof publishedEventsQuery>[number];

export type EventDetail = NonNullable<ClientReturn<typeof eventBySlugQuery>>;

export type EventRoom = ClientReturn<typeof eventRoomsQuery>[number];

export type EventType = ClientReturn<typeof eventTypesQuery>[number];

export type EventGroup = ClientReturn<typeof eventGroupsQuery>[number];

export async function fetchEventsPageContent(
  _locale: AppLocale,
  options: FetchOptions = {},
): Promise<EventsPageContent | null> {
  const { data } = await sanityFetch({
    query: eventsPageContentNbQuery,
    tags: ["eventsPage"],
    stega: options.stega,
  });
  return data;
}

export async function fetchPublishedEvents(): Promise<PublishedEvent[]> {
  const { data } = await sanityFetch({
    query: publishedEventsQuery,
    params: { today: getOsloDateString() },
    tags: ["events"],
  });
  return data;
}

export async function fetchEventBySlug(
  slug: string,
): Promise<EventDetail | null> {
  const { data } = await sanityFetch({
    query: eventBySlugQuery,
    params: { slug, today: getOsloDateString() },
    tags: ["events"],
  });
  return data;
}

export async function fetchEventRooms(): Promise<EventRoom[]> {
  return sanityClient.fetch(
    eventRoomsQuery,
    {},
    { next: { revalidate: 300, tags: ["rooms"] } },
  );
}

export async function fetchEventTypes(): Promise<EventType[]> {
  return sanityClient.fetch(
    eventTypesQuery,
    {},
    { next: { revalidate: 300, tags: ["eventTypes"] } },
  );
}

export async function fetchEventGroups(): Promise<EventGroup[]> {
  return sanityClient.fetch(
    eventGroupsQuery,
    {},
    { next: { revalidate: 300, tags: ["studentGroups"] } },
  );
}

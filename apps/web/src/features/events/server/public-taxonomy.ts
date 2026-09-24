import "server-only"

import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "@/lib/sanity/client"
import {
  eventRoomsQuery,
  eventTaxonomyGroupsQuery,
  eventTypesQuery,
} from "@/lib/sanity/queries"
import type { PublicEventTaxonomy } from "../api/schemas"

const TAXONOMY_QUERY_OPTIONS = {
  perspective: "published" as const,
  stega: false as const,
  cache: "force-cache" as const,
  next: { revalidate: 60 },
}

type TaxonomyGroupRow = { _id: string; name: string }
type TaxonomyTypeRow = {
  _id: string
  name: string
  taxonomyGroup: { _id: string; name: string } | null
}
type TaxonomyRoomRow = { _id: string; title: string; slug: string }

export async function fetchPublicEventTaxonomy(
  locale: AppLocale,
): Promise<PublicEventTaxonomy> {
  const [groupRows, typeRows, roomRows] = await Promise.all([
    sanityClient.fetch(
      eventTaxonomyGroupsQuery,
      { locale },
      TAXONOMY_QUERY_OPTIONS,
    ),
    sanityClient.fetch(eventTypesQuery, { locale }, TAXONOMY_QUERY_OPTIONS),
    sanityClient.fetch(eventRoomsQuery, { locale }, TAXONOMY_QUERY_OPTIONS),
  ])
  const groups = groupRows as TaxonomyGroupRow[]
  const types = typeRows as TaxonomyTypeRow[]
  const rooms = roomRows as TaxonomyRoomRow[]

  return {
    eventTypeGroups: groups.map(group => ({
      id: group._id,
      name: group.name,
      eventTypes: types
        .filter(type => type.taxonomyGroup?._id === group._id)
        .map(type => ({ id: type._id, name: type.name })),
    })),
    rooms: rooms.map(room => ({
      id: room._id,
      name: room.title,
      slug: room.slug,
    })),
  }
}

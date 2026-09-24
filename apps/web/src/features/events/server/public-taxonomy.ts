import "server-only"

import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "@/lib/sanity/client"
import {
  eventRoomsQuery,
  eventTaxonomyGroupsQuery,
  publicEventTaxonomyTypesQuery,
} from "@/lib/sanity/queries"
import type { PublicEventTaxonomy } from "../api/schemas"

const TAXONOMY_QUERY_OPTIONS = {
  perspective: "published" as const,
  stega: false as const,
  cache: "force-cache" as const,
  next: { revalidate: 60 },
}

type TaxonomyTypeRow = {
  _id: string
  name: string
  taxonomyGroupId: string | null
  isActive: boolean
}
type TaxonomyGroupRow = { _id: string; name: string }
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
    sanityClient.fetch(
      publicEventTaxonomyTypesQuery,
      { locale },
      TAXONOMY_QUERY_OPTIONS,
    ),
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
        .filter(type => type.taxonomyGroupId === group._id)
        .map(type => ({ id: type._id, name: type.name })),
    })),
    eventTypes: types.map(type => ({
      id: type._id,
      name: type.name,
      taxonomyGroupId: type.taxonomyGroupId,
      isActive: type.isActive,
    })),
    rooms: rooms.map(room => ({
      id: room._id,
      name: room.title,
      slug: room.slug,
    })),
  }
}

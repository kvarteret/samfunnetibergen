import "server-only"

import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "@/lib/sanity/client"
import { eventRoomsQuery, eventTypesQuery } from "@/lib/sanity/queries"
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
  taxonomyGroup: { _id: string; name: string } | null
}
type TaxonomyRoomRow = { _id: string; title: string; slug: string }

export async function fetchPublicEventTaxonomy(
  locale: AppLocale,
): Promise<PublicEventTaxonomy> {
  const [typeRows, roomRows] = await Promise.all([
    sanityClient.fetch(eventTypesQuery, { locale }, TAXONOMY_QUERY_OPTIONS),
    sanityClient.fetch(eventRoomsQuery, { locale }, TAXONOMY_QUERY_OPTIONS),
  ])
  const types = typeRows as TaxonomyTypeRow[]
  const rooms = roomRows as TaxonomyRoomRow[]
  const groups = new Map<
    string,
    {
      id: string
      name: string
      eventTypes: Array<{ id: string; name: string }>
    }
  >()

  for (const type of types) {
    const group = type.taxonomyGroup
    if (!group) continue
    const current = groups.get(group._id) ?? {
      id: group._id,
      name: group.name,
      eventTypes: [],
    }
    current.eventTypes.push({ id: type._id, name: type.name })
    groups.set(group._id, current)
  }

  return {
    eventTypeGroups: Array.from(groups.values()),
    rooms: rooms.map(room => ({
      id: room._id,
      name: room.title,
      slug: room.slug,
    })),
  }
}

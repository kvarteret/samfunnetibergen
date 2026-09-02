"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import {
  buildTaxonomyFromEvents,
  type EventFilters,
  type EventTaxonomy,
  filterEvents,
  parseEventFilters,
  serializeEventFilters,
} from "@/features/events/domain/eventUtils"
import type {
  PublicEvent,
  PublicOccurrence,
} from "@/features/events/domain/public-events"

type EventsContextValue = {
  events: PublicEvent[]
  taxonomy: EventTaxonomy
  filters: EventFilters
  setFilters: (filters: EventFilters) => void
  filteredEvents: PublicEvent[]
  filteredOccurrences: PublicOccurrence[]
}

const EventsContext = createContext<EventsContextValue | null>(null)
const EMPTY_OCCURRENCES: PublicOccurrence[] = []

export function EventsProvider({
  children,
  initialEvents,
  initialOccurrences = EMPTY_OCCURRENCES,
  initialSearchParams,
}: {
  children: React.ReactNode
  initialEvents: PublicEvent[]
  initialOccurrences?: PublicOccurrence[]
  initialSearchParams: Record<string, string | string[] | undefined>
}) {
  const pathname = usePathname()
  const router = useRouter()

  const taxonomy = useMemo(
    () => buildTaxonomyFromEvents(initialEvents),
    [initialEvents],
  )

  const [filters, setFiltersState] = useState<EventFilters>(() =>
    parseEventFilters(initialSearchParams),
  )

  const setFilters = useCallback(
    (nextFilters: EventFilters) => {
      setFiltersState(nextFilters)
      const serialized = serializeEventFilters(nextFilters)
      router.replace(serialized ? `${pathname}?${serialized}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router],
  )

  const filteredEvents = useMemo(
    () => filterEvents(initialEvents, filters),
    [filters, initialEvents],
  )
  const filteredEventIds = useMemo(
    () => new Set(filteredEvents.map(event => event._id)),
    [filteredEvents],
  )
  const filteredOccurrences = useMemo(
    () =>
      initialOccurrences.filter(occurrence =>
        filteredEventIds.has(occurrence.event._id),
      ),
    [filteredEventIds, initialOccurrences],
  )

  const contextValue = useMemo(
    () => ({
      events: initialEvents,
      taxonomy,
      filters,
      setFilters,
      filteredEvents,
      filteredOccurrences,
    }),
    [
      filters,
      filteredEvents,
      filteredOccurrences,
      initialEvents,
      setFilters,
      taxonomy,
    ],
  )

  return <EventsContext value={contextValue}>{children}</EventsContext>
}

export function useEvents(): EventsContextValue {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error("useEvents must be used inside EventsProvider")
  return ctx
}

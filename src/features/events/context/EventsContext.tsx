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
  type PublishedEvent,
  parseEventFilters,
  serializeEventFilters,
} from "@/features/events/domain/eventUtils"

type EventsContextValue = {
  events: PublishedEvent[]
  taxonomy: EventTaxonomy
  filters: EventFilters
  setFilters: (filters: EventFilters) => void
  filteredEvents: PublishedEvent[]
}

const EventsContext = createContext<EventsContextValue | null>(null)

export function EventsProvider({
  children,
  initialEvents,
  initialSearchParams,
}: {
  children: React.ReactNode
  initialEvents: PublishedEvent[]
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
    [initialEvents, filters],
  )

  const contextValue = useMemo(
    () => ({
      events: initialEvents,
      taxonomy,
      filters,
      setFilters,
      filteredEvents,
    }),
    [initialEvents, taxonomy, filters, setFilters, filteredEvents],
  )

  return <EventsContext value={contextValue}>{children}</EventsContext>
}

export function useEvents(): EventsContextValue {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error("useEvents must be used inside EventsProvider")
  return ctx
}

"use client"

import { usePathname, useSearchParams } from "next/navigation"
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import type {
  PublicEvent,
  PublicOccurrence,
} from "@/features/events/domain/events"
import {
  buildTaxonomyFromEvents,
  type EventFilters,
  type EventTaxonomy,
  filterEvents,
  parseEventFilters,
  serializeEventFilters,
} from "@/features/events/domain/eventUtils"

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

type EventsProviderProps = {
  children: React.ReactNode
  initialEvents: PublicEvent[]
  initialOccurrences?: PublicOccurrence[]
}

type SearchParamsRecord = Record<string, string | string[] | undefined>

const NO_SEARCH_PARAMS: SearchParamsRecord = {}

/**
 * Filters live in the URL but are read on the client, so the events pages stay
 * statically renderable. The prerendered HTML shows the unfiltered list; the
 * browser then renders with the URL's filters during hydration.
 */
export function EventsProvider(props: EventsProviderProps) {
  return (
    <Suspense
      fallback={
        <EventsStateProvider {...props} searchParams={NO_SEARCH_PARAMS} />
      }
    >
      <EventsProviderFromUrl {...props} />
    </Suspense>
  )
}

function EventsProviderFromUrl(props: EventsProviderProps) {
  const searchParams = useSearchParams()
  const record = useMemo(() => {
    const result: SearchParamsRecord = {}
    for (const key of new Set(searchParams.keys())) {
      const values = searchParams.getAll(key)
      result[key] = values.length > 1 ? values : values[0]
    }
    return result
  }, [searchParams])

  return <EventsStateProvider {...props} searchParams={record} />
}

function EventsStateProvider({
  children,
  initialEvents,
  initialOccurrences = EMPTY_OCCURRENCES,
  searchParams,
}: EventsProviderProps & { searchParams: SearchParamsRecord }) {
  const pathname = usePathname()

  const taxonomy = useMemo(
    () => buildTaxonomyFromEvents(initialEvents),
    [initialEvents],
  )

  const [filters, setFiltersState] = useState<EventFilters>(() =>
    parseEventFilters(searchParams),
  )

  const setFilters = useCallback(
    (nextFilters: EventFilters) => {
      setFiltersState(nextFilters)
      const serialized = serializeEventFilters(nextFilters)
      // Filtering happens in the browser, so update the URL without a server
      // round trip. Next.js keeps `useSearchParams` in sync with replaceState.
      window.history.replaceState(
        null,
        "",
        serialized ? `${pathname}?${serialized}` : pathname,
      )
    },
    [pathname],
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

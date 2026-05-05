"use client"

import { createContext, useContext, useMemo, useState } from "react"

import type { AppLocale } from "@/i18n/routing"
import {
    type EventDetail,
    type EventFilters,
    type EventSection,
    type EventTaxonomy,
    filterEvents,
    groupEventsByTaxonomy,
    parseEventFilters,
} from "@/lib/events-utils"

type EventsContextValue = {
    events: EventDetail[]
    taxonomy: EventTaxonomy
    filters: EventFilters
    setFilters: (filters: EventFilters) => void
    filteredEvents: EventDetail[]
    sections: EventSection[]
}

const EventsContext = createContext<EventsContextValue | null>(null)

export function EventsProvider({
    children,
    initialEvents,
    initialTaxonomy,
    initialSearchParams,
    locale,
}: {
    children: React.ReactNode
    initialEvents: EventDetail[]
    initialTaxonomy: EventTaxonomy
    initialSearchParams: Record<string, string | string[] | undefined>
    locale: AppLocale
}) {
    const [filters, setFilters] = useState<EventFilters>(() =>
        parseEventFilters(initialSearchParams),
    )

    const filteredEvents = useMemo(
        () => filterEvents(initialEvents, filters),
        [initialEvents, filters],
    )

    const sections = useMemo(
        () => groupEventsByTaxonomy(filteredEvents, initialTaxonomy, locale),
        [filteredEvents, initialTaxonomy, locale],
    )

    return (
        <EventsContext
            value={{
                events: initialEvents,
                taxonomy: initialTaxonomy,
                filters,
                setFilters,
                filteredEvents,
                sections,
            }}
        >
            {children}
        </EventsContext>
    )
}

export function useEvents(): EventsContextValue {
    const ctx = useContext(EventsContext)
    if (!ctx) throw new Error("useEvents must be used inside EventsProvider")
    return ctx
}

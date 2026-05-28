"use client"

import { usePathname, useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useMemo, useState } from "react"

import {
    buildTaxonomyFromEvents,
    type EventFilters,
    type EventTaxonomy,
    filterEvents,
    type PublishedEvent,
    parseEventFilters,
    serializeEventFilters,
} from "@/features/events/domain/eventUtils"

type ArrangementsContextValue = {
    arrangements: PublishedEvent[]
    taxonomy: EventTaxonomy
    filters: EventFilters
    setFilters: (filters: EventFilters) => void
    filteredArrangements: PublishedEvent[]
}

const ArrangementsContext = createContext<ArrangementsContextValue | null>(null)

export function ArrangementsProvider({
    children,
    initialArrangements,
    initialSearchParams,
}: {
    children: React.ReactNode
    initialArrangements: PublishedEvent[]
    initialSearchParams: Record<string, string | string[] | undefined>
}) {
    const pathname = usePathname()
    const router = useRouter()

    const taxonomy = useMemo(
        () => buildTaxonomyFromEvents(initialArrangements),
        [initialArrangements],
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

    const filteredArrangements = useMemo(
        () => filterEvents(initialArrangements, filters),
        [initialArrangements, filters],
    )

    return (
        <ArrangementsContext
            value={{
                arrangements: initialArrangements,
                taxonomy,
                filters,
                setFilters,
                filteredArrangements,
            }}
        >
            {children}
        </ArrangementsContext>
    )
}

export function useArrangements(): ArrangementsContextValue {
    const ctx = useContext(ArrangementsContext)
    if (!ctx) throw new Error("useArrangements must be used inside ArrangementsProvider")
    return ctx
}

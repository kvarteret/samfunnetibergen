"use client"

import { usePathname, useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useMemo, useState } from "react"

import {
    type ArrangementFilters,
    type ArrangementTaxonomy,
    buildTaxonomyFromArrangements,
    filterArrangements,
    type PublishedArrangement,
    parseArrangementFilters,
    serializeArrangementFilters,
} from "@/features/events/domain/arrangementUtils"

type ArrangementsContextValue = {
    arrangements: PublishedArrangement[]
    taxonomy: ArrangementTaxonomy
    filters: ArrangementFilters
    setFilters: (filters: ArrangementFilters) => void
    filteredArrangements: PublishedArrangement[]
}

const ArrangementsContext = createContext<ArrangementsContextValue | null>(null)

export function ArrangementsProvider({
    children,
    initialArrangements,
    initialSearchParams,
}: {
    children: React.ReactNode
    initialArrangements: PublishedArrangement[]
    initialSearchParams: Record<string, string | string[] | undefined>
}) {
    const pathname = usePathname()
    const router = useRouter()

    const taxonomy = useMemo(
        () => buildTaxonomyFromArrangements(initialArrangements),
        [initialArrangements],
    )

    const [filters, setFiltersState] = useState<ArrangementFilters>(() =>
        parseArrangementFilters(initialSearchParams),
    )

    const setFilters = useCallback(
        (nextFilters: ArrangementFilters) => {
            setFiltersState(nextFilters)
            const serialized = serializeArrangementFilters(nextFilters)
            router.replace(serialized ? `${pathname}?${serialized}` : pathname, {
                scroll: false,
            })
        },
        [pathname, router],
    )

    const filteredArrangements = useMemo(
        () => filterArrangements(initialArrangements, filters),
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

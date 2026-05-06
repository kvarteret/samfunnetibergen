"use client"

import { useTranslations } from "next-intl"

import type { AppLocale } from "@/i18n/routing"
import { useEvents } from "@/lib/events-context"
import {
    countEventFilters,
    getPrimaryTaxonomyGroups,
    getTaxonomyGroupLabel,
} from "@/lib/events-utils"
import { FilterButton } from "./FilterButton"

export interface EventsFiltersProps {
    filterAllLabel: string
    filterMoreLabel: string
    filterOrganizerLabel: string
    filterTypeLabel: string
    locale: AppLocale
}

export function EventsFilters({
    filterAllLabel,
    filterMoreLabel,
    filterOrganizerLabel,
    filterTypeLabel,
    locale,
}: EventsFiltersProps) {
    const t = useTranslations("EventsPage")
    const { filters, filteredEvents, setFilters, taxonomy } = useEvents()
    const activeFilterCount = countEventFilters(filters)

    const toggleTaxonomyGroup = (groupName: string) =>
        setFilters({
            eventTypeIds: [],
            organizerGroupIds: filters.organizerGroupIds,
            taxonomyGroup: filters.taxonomyGroup === groupName ? null : groupName,
        })

    const toggleEventType = (id: string) =>
        setFilters({
            ...filters,
            eventTypeIds: filters.eventTypeIds.includes(id)
                ? filters.eventTypeIds.filter(x => x !== id)
                : [...filters.eventTypeIds, id],
        })

    const toggleOrganizer = (id: string) =>
        setFilters({
            ...filters,
            organizerGroupIds: filters.organizerGroupIds.includes(id)
                ? filters.organizerGroupIds.filter(x => x !== id)
                : [...filters.organizerGroupIds, id],
        })

    return (
        <div className="space-y-6 py-6">
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <FilterButton
                        isActive={activeFilterCount === 0}
                        label={filterAllLabel}
                        onClick={() =>
                            setFilters({
                                eventTypeIds: [],
                                organizerGroupIds: [],
                                taxonomyGroup: null,
                            })
                        }
                    />
                    {getPrimaryTaxonomyGroups(taxonomy).map(groupName => (
                        <FilterButton
                            isActive={
                                filters.taxonomyGroup === groupName &&
                                filters.eventTypeIds.length === 0
                            }
                            key={groupName}
                            label={getTaxonomyGroupLabel(groupName, locale)}
                            onClick={() => toggleTaxonomyGroup(groupName)}
                        />
                    ))}
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/65">
                    {t("filterResultCount", { count: filteredEvents.length })}
                </p>
            </div>

            <details className="group">
                <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.18em] text-foreground underline underline-offset-4">
                    {filterMoreLabel}
                    {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </summary>
                <div className="mt-6 space-y-8">
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/65">
                            {filterTypeLabel}
                        </h2>
                        <div className="space-y-5">
                            {taxonomy.event_type_groups.map(group => (
                                <div className="space-y-2" key={group.name}>
                                    <h3 className="font-heading text-2xl">
                                        {getTaxonomyGroupLabel(group.name, locale)}
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {group.event_types.map(eventType => (
                                            <FilterButton
                                                isActive={filters.eventTypeIds.includes(
                                                    eventType.id,
                                                )}
                                                key={eventType.id}
                                                label={eventType.name}
                                                onClick={() => toggleEventType(eventType.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/65">
                            {filterOrganizerLabel}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {taxonomy.organizer_groups.map(group => (
                                <FilterButton
                                    isActive={filters.organizerGroupIds.includes(group.id)}
                                    key={group.id}
                                    label={group.name}
                                    onClick={() => toggleOrganizer(group.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </details>
        </div>
    )
}

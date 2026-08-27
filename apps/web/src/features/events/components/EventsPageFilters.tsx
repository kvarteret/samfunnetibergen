"use client"

import { Collapsible } from "@base-ui/react/collapsible"
import { useTranslations } from "next-intl"
import posthog from "posthog-js"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { useEvents } from "@/features/events/context/EventsContext"
import { countEventFilters } from "@/features/events/domain/eventUtils"

export function EventsPageFilters() {
  const t = useTranslations("EventsPage")
  const { filters, filteredEvents, setFilters, taxonomy } = useEvents()
  const activeFilterCount = countEventFilters(filters)

  const clearAll = () => {
    posthog.capture("events_filter_used", {
      filter_type: "taxonomy_group",
      value: null,
    })
    setFilters({
      taxonomyGroupName: null,
      eventTypeIds: [],
      organizerGroupIds: [],
    })
  }

  const toggleTaxonomyGroup = (name: string) => {
    posthog.capture("events_filter_used", {
      filter_type: "taxonomy_group",
      value: name,
    })
    setFilters({
      taxonomyGroupName: filters.taxonomyGroupName === name ? null : name,
      eventTypeIds: [],
      organizerGroupIds: filters.organizerGroupIds,
    })
  }

  return (
    <div className="space-y-6 border-y-2 border-border py-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            onValueChange={value => {
              if (value === "all") {
                clearAll()
              } else {
                toggleTaxonomyGroup(value)
              }
            }}
            options={[
              { value: "all", label: t("filterAll") },
              ...taxonomy.taxonomyGroups.map(group => ({
                value: group.name,
                label: group.name,
              })),
            ]}
            value={
              activeFilterCount === 0
                ? "all"
                : (filters.taxonomyGroupName ?? "all")
            }
          />
        </div>
        <p className="font-heading uppercase tracking-widest">
          {t("filterResultCount", { count: filteredEvents.length })}
        </p>
      </div>

      {(taxonomy.eventTypes.length > 0 ||
        taxonomy.organizerGroups.length > 0) && (
        <Collapsible.Root>
          <Collapsible.Trigger className="cursor-pointer font-heading uppercase tracking-widest text-foreground underline underline-offset-4 focus-brutal">
            {t("filterMore")}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Collapsible.Trigger>
          <Collapsible.Panel>
            <div className="mt-6 space-y-8">
              {taxonomy.taxonomyGroups.map(group => {
                const groupEventTypes = taxonomy.eventTypes.filter(
                  et => et.taxonomyGroupName === group.name,
                )
                if (groupEventTypes.length === 0) return null
                const groupEventTypeIds = new Set(
                  groupEventTypes.map(eventType => eventType._id),
                )
                return (
                  <div className="space-y-3" key={group._id}>
                    <h2 className="font-heading uppercase tracking-widest">
                      {t("filterType")} — {group.name}
                    </h2>
                    <ToggleGroup
                      onValueChange={selectedGroupIds => {
                        posthog.capture("events_filter_used", {
                          filter_type: "event_type",
                          value: selectedGroupIds.join(",") || null,
                        })
                        setFilters({
                          ...filters,
                          eventTypeIds: [
                            ...filters.eventTypeIds.filter(
                              id => !groupEventTypeIds.has(id),
                            ),
                            ...selectedGroupIds,
                          ],
                        })
                      }}
                      options={groupEventTypes.map(eventType => ({
                        value: eventType._id,
                        label: eventType.name,
                      }))}
                      value={filters.eventTypeIds.filter(id =>
                        groupEventTypeIds.has(id),
                      )}
                    />
                  </div>
                )
              })}
              {taxonomy.organizerGroups.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-heading uppercase tracking-widest">
                    {t("filterOrganizer")}
                  </h2>
                  <ToggleGroup
                    onValueChange={organizerGroupIds => {
                      posthog.capture("events_filter_used", {
                        filter_type: "organizer",
                        value: organizerGroupIds.join(",") || null,
                      })
                      setFilters({ ...filters, organizerGroupIds })
                    }}
                    options={taxonomy.organizerGroups.map(group => ({
                      value: group._id,
                      label: group.name,
                    }))}
                    value={filters.organizerGroupIds}
                  />
                </div>
              )}
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      )}
    </div>
  )
}

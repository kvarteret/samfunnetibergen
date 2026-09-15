"use client"

import { Collapsible } from "@base-ui/react/collapsible"
import { ChevronDown, SlidersHorizontal, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { useEvents } from "@/features/events/context/EventsContext"
import { countEventFilters } from "@/features/events/domain/eventUtils"

export function EventsPageFilters() {
  const t = useTranslations("EventsPage")
  const { filters, filteredEvents, setFilters, taxonomy } = useEvents()
  const activeFilterCount = countEventFilters(filters)

  const clearAll = () =>
    setFilters({
      taxonomyGroupName: null,
      eventTypeIds: [],
      organizerGroupIds: [],
    })

  const toggleTaxonomyGroup = (name: string) =>
    setFilters({
      taxonomyGroupName: filters.taxonomyGroupName === name ? null : name,
      eventTypeIds: [],
      organizerGroupIds: filters.organizerGroupIds,
    })

  return (
    <Collapsible.Root>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
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
        {(taxonomy.eventTypes.length > 0 ||
          taxonomy.organizerGroups.length > 0) && (
          <Collapsible.Trigger className="group inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-base bg-card px-4 text-sm font-heading text-foreground transition-colors hover:bg-muted focus-brutal data-panel-open:bg-muted">
            <SlidersHorizontal aria-hidden className="size-4" />
            {t("filterMore")}
            <ChevronDown
              aria-hidden
              className="size-4 transition-transform group-data-panel-open:rotate-180"
            />
          </Collapsible.Trigger>
        )}
      </div>

      <Collapsible.Panel>
        <div className="mt-5 rounded-base bg-card p-4 sm:p-6">
          {taxonomy.eventTypes.length > 0 && (
            <fieldset className="min-w-0">
              <legend className="mb-4 text-sm font-heading text-foreground-muted">
                {t("filterType")}
              </legend>
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
                {taxonomy.taxonomyGroups.map(group => {
                  const groupEventTypes = taxonomy.eventTypes.filter(
                    et => et.taxonomyGroupName === group.name,
                  )
                  if (groupEventTypes.length === 0) return null
                  const groupEventTypeIds = new Set(
                    groupEventTypes.map(eventType => eventType._id),
                  )
                  return (
                    <fieldset className="min-w-0" key={group._id}>
                      <legend className="mb-3 text-xl font-heading">
                        {group.name}
                      </legend>
                      <ToggleGroup
                        className="text-sm"
                        onValueChange={selectedGroupIds =>
                          setFilters({
                            ...filters,
                            eventTypeIds: [
                              ...filters.eventTypeIds.filter(
                                id => !groupEventTypeIds.has(id),
                              ),
                              ...selectedGroupIds,
                            ],
                          })
                        }
                        options={groupEventTypes.map(eventType => ({
                          value: eventType._id,
                          label: eventType.name,
                        }))}
                        value={filters.eventTypeIds.filter(id =>
                          groupEventTypeIds.has(id),
                        )}
                      />
                    </fieldset>
                  )
                })}
              </div>
            </fieldset>
          )}
          {taxonomy.organizerGroups.length > 0 && (
            <fieldset className="mt-6 min-w-0 pt-5">
              <legend className="sr-only">{t("filterOrganizer")}</legend>
              <p
                aria-hidden
                className="mb-3 text-sm font-heading text-foreground-muted"
              >
                {t("filterOrganizer")}
              </p>
              <ToggleGroup
                className="text-sm"
                onValueChange={organizerGroupIds =>
                  setFilters({ ...filters, organizerGroupIds })
                }
                options={taxonomy.organizerGroups.map(group => ({
                  value: group._id,
                  label: group.name,
                }))}
                value={filters.organizerGroupIds}
              />
            </fieldset>
          )}
        </div>
      </Collapsible.Panel>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p
          aria-live="polite"
          aria-atomic="true"
          className="text-sm text-foreground-muted"
        >
          {t("filterResultCount", { count: filteredEvents.length })}
        </p>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-heading underline-offset-4 hover:underline focus-brutal"
          >
            <X aria-hidden className="size-3.5" />
            {t("filterReset")}
          </button>
        )}
      </div>
    </Collapsible.Root>
  )
}

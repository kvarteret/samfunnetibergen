"use client";

import { useTranslations } from "next-intl";

import { useEvents } from "@/features/events/context/EventsContext";
import { countEventFilters } from "@/features/events/domain/eventUtils";
import { EventsPageFilterButton } from "./EventsPageFilterButton";

interface EventsFiltersProps {
  filterAllLabel: string;
  filterMoreLabel: string;
  filterOrganizerLabel: string;
  filterTypeLabel: string;
}

export function EventsPageFilters({
  filterAllLabel,
  filterMoreLabel,
  filterOrganizerLabel,
  filterTypeLabel,
}: EventsFiltersProps) {
  const t = useTranslations("EventsPage");
  const { filters, filteredEvents, setFilters, taxonomy } = useEvents();
  const activeFilterCount = countEventFilters(filters);

  const clearAll = () =>
    setFilters({
      taxonomyGroupName: null,
      eventTypeIds: [],
      organizerGroupIds: [],
    });

  const toggleTaxonomyGroup = (name: string) =>
    setFilters({
      taxonomyGroupName: filters.taxonomyGroupName === name ? null : name,
      eventTypeIds: [],
      organizerGroupIds: filters.organizerGroupIds,
    });

  const toggleEventType = (id: string) =>
    setFilters({
      ...filters,
      eventTypeIds: filters.eventTypeIds.includes(id)
        ? filters.eventTypeIds.filter((x) => x !== id)
        : [...filters.eventTypeIds, id],
    });

  const toggleOrganizer = (id: string) =>
    setFilters({
      ...filters,
      organizerGroupIds: filters.organizerGroupIds.includes(id)
        ? filters.organizerGroupIds.filter((x) => x !== id)
        : [...filters.organizerGroupIds, id],
    });

  return (
    <div className="space-y-6 border-y-2 border-border py-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <EventsPageFilterButton
            isActive={activeFilterCount === 0}
            label={filterAllLabel}
            onClick={clearAll}
          />
          {taxonomy.taxonomyGroups.map((group) => (
            <EventsPageFilterButton
              isActive={
                filters.taxonomyGroupName === group.name &&
                filters.eventTypeIds.length === 0
              }
              key={group._id}
              label={group.name}
              onClick={() => toggleTaxonomyGroup(group.name)}
            />
          ))}
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/65">
          {t("filterResultCount", { count: filteredEvents.length })}
        </p>
      </div>

      {(taxonomy.eventTypes.length > 0 ||
        taxonomy.organizerGroups.length > 0) && (
        <details>
          <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.18em] text-foreground underline underline-offset-4">
            {filterMoreLabel}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </summary>
          <div className="mt-6 space-y-8">
            {taxonomy.taxonomyGroups.map((group) => {
              const groupEventTypes = taxonomy.eventTypes.filter(
                (et) => et.taxonomyGroupName === group.name,
              );
              if (groupEventTypes.length === 0) return null;
              return (
                <div className="space-y-3" key={group._id}>
                  <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/65">
                    {filterTypeLabel} — {group.name}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {groupEventTypes.map((eventType) => (
                      <EventsPageFilterButton
                        isActive={filters.eventTypeIds.includes(eventType._id)}
                        key={eventType._id}
                        label={eventType.name}
                        onClick={() => toggleEventType(eventType._id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {taxonomy.organizerGroups.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/65">
                  {filterOrganizerLabel}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {taxonomy.organizerGroups.map((group) => (
                    <EventsPageFilterButton
                      isActive={filters.organizerGroupIds.includes(group._id)}
                      key={group._id}
                      label={group.name}
                      onClick={() => toggleOrganizer(group._id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

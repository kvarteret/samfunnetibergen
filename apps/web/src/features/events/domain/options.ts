import type { SelectOption } from "@/components/ui/select-field"
import type { EventGroup, EventRoom, EventType } from "@/lib/sanity/fetch"

export function eventTypeOptions(types: EventType[]): SelectOption[] {
  return types.map(et => ({
    value: et._id,
    label: et.taxonomyGroup ? `${et.taxonomyGroup.name} — ${et.name}` : et.name,
  }))
}

export function roomOptions(rooms: EventRoom[]): SelectOption[] {
  return rooms.map(room => ({
    value: room._id,
    label: room.title,
  }))
}

export function groupOptions(groups: EventGroup[]): SelectOption[] {
  return groups.map(group => ({
    value: group._id,
    label: group.name,
  }))
}

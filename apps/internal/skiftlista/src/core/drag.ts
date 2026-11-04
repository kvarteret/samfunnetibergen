/**
 * What a drag carries, and what a drop on a place means. Dragging is only a
 * shortcut: every drop has a click path (select a person, or "Flytt eller
 * bytt"), as WCAG 2.5.7 asks.
 */

import type { Op } from "./ops"
import type { Place } from "./types"
import { isOpen } from "./view"

export type DragData =
  | { kind: "person"; volunteerId: number }
  | { kind: "placed"; slotId: number }

const DRAG_TYPE = "application/x-skiftlista"

export function setDrag(event: DragEvent, data: DragData) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(data))
  event.dataTransfer.effectAllowed = "move"
}

export function readDrag(event: DragEvent): DragData | null {
  const raw = event.dataTransfer?.getData(DRAG_TYPE)
  return raw ? (JSON.parse(raw) as DragData) : null
}

/** The action a drop (or a click in move mode) means for a target place. */
export function dropOp(data: DragData, target: Place): Op | null {
  const targetOpen = isOpen(target)
  if (data.kind === "person") {
    return targetOpen
      ? { type: "place", slotId: target.slot_id, volunteerId: data.volunteerId }
      : {
          type: "replace",
          slotId: target.slot_id,
          volunteerId: data.volunteerId,
        }
  }
  if (data.slotId === target.slot_id) return null
  return targetOpen
    ? { type: "move", fromSlotId: data.slotId, toSlotId: target.slot_id }
    : { type: "swap", slotA: data.slotId, slotB: target.slot_id }
}

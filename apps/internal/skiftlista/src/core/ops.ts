/**
 * Leader actions in place terms (slot ids, not assignment ids), so an undo
 * entry stays valid after the server hands out new assignment ids. "Angre"
 * is client side (decided in Personal's HANDOFF, item 8): each action stores
 * its inverse, and undoing runs the inverse through the normal endpoints, so
 * the server checks every rule again and may refuse.
 *
 * A place id here is a "box": Personal's slot id times 100 plus a seat, and
 * the seat of a person can change when others are added, moved or removed in
 * the same slot. So an undo entry is never trusted blindly: the inverse is
 * worked out from the week the server answered with (where the person is NOW),
 * and it names the person it expects there (`expect`). If someone else sits
 * there when the leader presses "Angre", the undo is refused instead of
 * touching the wrong person.
 */

import {
  type LeaderApi,
  type Place,
  type PlaceKind,
  RefusedError,
  type WeekBoard,
  type WriteResult,
} from "./types"

/**
 * `confirmed` is set once the leader accepted the big warning for a person
 * who lacks the qualification (the popup in App.svelte), and on undo
 * actions, which only put back what the leader already confirmed.
 * `expect` (and `expectA`, `expectB`) is the volunteer who must be on the
 * place when an undo runs; forward actions leave it out.
 */
export type Op =
  | { type: "place"; slotId: number; volunteerId: number; confirmed?: boolean }
  | { type: "remove"; slotId: number; expect?: number }
  | {
      type: "replace"
      slotId: number
      volunteerId: number
      confirmed?: boolean
      expect?: number
    }
  | {
      type: "move"
      fromSlotId: number
      toSlotId: number
      confirmed?: boolean
      expect?: number
    }
  | {
      type: "swap"
      slotA: number
      slotB: number
      expectA?: number
      expectB?: number
    }
  | { type: "status"; status: "open" | "published" }
  /** "+": one more place of a kind on a shift. Addressed by shift and kind, not by place, so undo survives new ids. */
  | { type: "addPlace"; shiftId: number; kind: PlaceKind }
  /** "−": one empty place of a kind less. The inverse of addPlace. */
  | { type: "removePlace"; shiftId: number; kind: PlaceKind }

export const UNDO_LIMIT = 20

export function placeById(board: WeekBoard, slotId: number): Place | null {
  for (const shift of board.shifts) {
    const place = shift.places.find(candidate => candidate.slot_id === slotId)
    if (place) return place
  }
  return null
}

/** Who is on the place now (a "kan ikke i dag" person counts as gone). */
export function occupant(board: WeekBoard, slotId: number): number | null {
  const assignment = placeById(board, slotId)?.assignment
  return assignment && !assignment.cannot_attend
    ? assignment.volunteer_id
    : null
}

function shiftIdOf(board: WeekBoard, slotId: number): number | null {
  for (const shift of board.shifts)
    if (shift.places.some(place => place.slot_id === slotId))
      return shift.shift_id
  return null
}

/**
 * The place a person is on in a shift NOW. Used on the week the server
 * answered with, because a person can land on another seat than the one the
 * leader dropped them on.
 */
function whereIs(
  board: WeekBoard,
  shiftId: number | null,
  volunteerId: number | null,
): number | null {
  if (shiftId === null || volunteerId === null) return null
  const shift = board.shifts.find(candidate => candidate.shift_id === shiftId)
  const place = shift?.places.find(
    candidate =>
      candidate.assignment?.volunteer_id === volunteerId &&
      !candidate.assignment.cannot_attend,
  )
  return place?.slot_id ?? null
}

function assignmentAt(board: WeekBoard, slotId: number): number {
  const assignment = placeById(board, slotId)?.assignment
  if (!assignment)
    throw new RefusedError(
      "Plassen er ikke lenger besatt. Uka er oppdatert, prøv igjen.",
    )
  return assignment.assignment_id
}

/** An undo only runs if the person it was made for is still on the place. */
function expectAt(
  board: WeekBoard,
  slotId: number,
  expected: number | undefined,
): void {
  if (expected === undefined) return
  if (occupant(board, slotId) !== expected)
    throw new RefusedError(
      "Kan ikke angre: plassen er endret siden du gjorde dette. Uka er oppdatert.",
    )
}

/**
 * The action that puts things back. `before` is the week the action ran on
 * and `after` the week the server answered with. Publishing is not undoable:
 * it changes what volunteers see, so it takes its own button and a question.
 */
export function inverseOf(
  op: Op,
  before: WeekBoard,
  after: WeekBoard,
): Op | null {
  switch (op.type) {
    case "place": {
      const where = whereIs(after, shiftIdOf(before, op.slotId), op.volunteerId)
      return where === null
        ? null
        : { type: "remove", slotId: where, expect: op.volunteerId }
    }
    case "remove": {
      const volunteerId = occupant(before, op.slotId)
      return volunteerId === null
        ? null
        : { type: "place", slotId: op.slotId, volunteerId, confirmed: true }
    }
    case "replace": {
      const previous = occupant(before, op.slotId)
      const where = whereIs(after, shiftIdOf(before, op.slotId), op.volunteerId)
      return previous === null || where === null
        ? null
        : {
            type: "replace",
            slotId: where,
            volunteerId: previous,
            confirmed: true,
            expect: op.volunteerId,
          }
    }
    case "move": {
      const moved = occupant(before, op.fromSlotId)
      const where = whereIs(after, shiftIdOf(before, op.toSlotId), moved)
      return moved === null || where === null
        ? null
        : {
            type: "move",
            fromSlotId: where,
            toSlotId: op.fromSlotId,
            confirmed: true,
            expect: moved,
          }
    }
    case "swap": {
      const a = occupant(before, op.slotA)
      const b = occupant(before, op.slotB)
      const whereB = whereIs(after, shiftIdOf(before, op.slotA), b)
      const whereA = whereIs(after, shiftIdOf(before, op.slotB), a)
      return a === null || b === null || whereA === null || whereB === null
        ? null
        : {
            type: "swap",
            slotA: whereB,
            slotB: whereA,
            expectA: b,
            expectB: a,
          }
    }
    case "status":
      return null
    case "addPlace":
      return { type: "removePlace", shiftId: op.shiftId, kind: op.kind }
    case "removePlace":
      return { type: "addPlace", shiftId: op.shiftId, kind: op.kind }
  }
}

/** Runs an action against the current week. */
export async function run(
  api: LeaderApi,
  board: WeekBoard,
  op: Op,
): Promise<WriteResult> {
  switch (op.type) {
    case "place":
      return api.place(board, op.slotId, op.volunteerId, op.confirmed)
    case "remove":
      expectAt(board, op.slotId, op.expect)
      return api.remove(board, assignmentAt(board, op.slotId))
    case "replace":
      expectAt(board, op.slotId, op.expect)
      return api.replace(
        board,
        assignmentAt(board, op.slotId),
        op.volunteerId,
        op.confirmed,
      )
    case "move":
      expectAt(board, op.fromSlotId, op.expect)
      return api.move(
        board,
        assignmentAt(board, op.fromSlotId),
        op.toSlotId,
        op.confirmed,
      )
    case "swap":
      expectAt(board, op.slotA, op.expectA)
      expectAt(board, op.slotB, op.expectB)
      return api.swap(
        board,
        assignmentAt(board, op.slotA),
        assignmentAt(board, op.slotB),
      )
    case "status":
      return api.setStatus(board, op.status)
    case "addPlace":
      return api.addPlace(board, op.shiftId, op.kind)
    case "removePlace":
      return api.removePlace(board, emptyPlaceOf(board, op.shiftId, op.kind))
  }
}

/** The last empty place of a kind on a shift: the one "−" takes away. */
export function emptyPlaceOf(
  board: WeekBoard,
  shiftId: number,
  kind: PlaceKind,
): number {
  const shift = board.shifts.find(candidate => candidate.shift_id === shiftId)
  const empty = shift?.places.filter(
    place => place.kind === kind && place.assignment === null,
  )
  const last = empty?.at(-1)
  if (!last)
    throw new RefusedError(
      "Alle plassene av denne typen er i bruk. Ta personen av først.",
    )
  return last.slot_id
}

export interface UndoEntry {
  /** Which week the entry belongs to; undo only runs in that week. */
  weekKey: string
  label: string
  inverse: Op
}

export function pushUndo(stack: UndoEntry[], entry: UndoEntry): UndoEntry[] {
  return [...stack, entry].slice(-UNDO_LIMIT)
}

export function weekKeyOf(board: WeekBoard): string {
  return `${board.bar.id}|${board.week_start}`
}

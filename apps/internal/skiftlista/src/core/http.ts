/**
 * The real `LeaderApi`: reads from Personal through the same-origin path
 * `/personal/*` (Vite's proxy in development, a Vercel rewrite when hosted).
 * The session cookie travels with every request; the app never sees a token
 * except the CSRF token that `GET /me` hands out for later writes.
 *
 * Personal's JSON is translated here and nowhere else:
 *
 * - A slot with room for several people has ONE slot id in Personal. Each box
 *   gets its own app id `slot_id * SEATS + seat`, so every box on the page is
 *   unique. Writes turn it back with `realSlot()`.
 * - `fit` is given per slot; it is copied to every open seat of the slot.
 */

import {
  type Assignment,
  type Fit,
  type LeaderApi,
  type LeaderMe,
  type Note,
  type Person,
  type Place,
  type PlaceKind,
  RefusedError,
  type Shift,
  type WeekBoard,
  type WeekStatus,
  type WriteResult,
} from "./types"

/** Seats per slot that the app id leaves room for. */
export const SEATS = 100

export const BASE = "/personal/api/v1/leader/shifts"

export const appPlaceId = (slotId: number, seat: number): number =>
  slotId * SEATS + seat

export const realSlot = (placeId: number): number => Math.floor(placeId / SEATS)

/** Not signed in to Personal (401): the app shows a link to the login. */
export class NotSignedInError extends Error {}

// ---- Personal's JSON (see openapi.json, tag leader-shifts, in Personal) ----

interface WireAssignment extends Assignment {}

interface WirePlace {
  slot_id: number
  seat: number
  kind: PlaceKind
  assignment: WireAssignment | null
  suggestion: Place["suggestion"]
  needed: boolean
}

interface WireShift extends Omit<Shift, "places"> {
  places: WirePlace[]
}

export type WireFit =
  | { ok: true; warnings: Note[]; needs_confirmation?: boolean }
  | { ok: false; reason: string }

export interface WireBoard
  extends Omit<WeekBoard, "shifts" | "fit" | "status" | "people"> {
  status: WeekStatus
  shifts: WireShift[]
  people: (Omit<Person, "week_minutes"> & { week_minutes?: number })[]
  fit: Record<string, Record<string, WireFit>>
}

/** Personal's board as the app's `WeekBoard`. */
export function toBoard(wire: WireBoard): WeekBoard {
  const shifts: Shift[] = wire.shifts.map(shift => ({
    ...shift,
    places: shift.places.map(place => ({
      slot_id: appPlaceId(place.slot_id, place.seat),
      kind: place.kind,
      assignment: place.assignment,
      suggestion: place.suggestion,
      needed: place.needed,
    })),
  }))

  // Open (or "kan ikke i dag") seats per real slot, to spread the fit.
  const openSeats = new Map<number, number[]>()
  for (const shift of wire.shifts) {
    for (const place of shift.places) {
      if (place.assignment && !place.assignment.cannot_attend) continue
      const list = openSeats.get(place.slot_id) ?? []
      list.push(appPlaceId(place.slot_id, place.seat))
      openSeats.set(place.slot_id, list)
    }
  }
  const fit: WeekBoard["fit"] = {}
  for (const [volunteerId, perSlot] of Object.entries(wire.fit)) {
    const spread: Record<string, Fit> = {}
    for (const [slotId, value] of Object.entries(perSlot)) {
      for (const placeId of openSeats.get(Number(slotId)) ?? [])
        spread[placeId] = value
    }
    fit[volunteerId] = spread
  }

  return {
    ...wire,
    shifts,
    fit,
    people: wire.people.map(person => ({
      ...person,
      week_minutes: person.week_minutes ?? 0,
    })),
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new NotSignedInError("Ikke logget inn.")
  if (!response.ok) {
    let detail = ""
    try {
      detail = ((await response.json()) as { detail?: unknown })
        .detail as string
    } catch {
      // Not JSON (for example a proxy error page): fall through.
    }
    throw new RefusedError(
      typeof detail === "string" && detail
        ? detail
        : `Personal svarte ${response.status}. Prøv igjen.`,
    )
  }
  return (await response.json()) as T
}

interface WireWriteResult {
  message: string
  warnings: Note[]
  board: WireBoard
}

/**
 * Reads and writes against Personal. A write sends, besides the body:
 *
 * - `X-CSRF-Token`: the token `GET /me` handed out (the cookie it must match
 *   is HttpOnly, so only this code can send it back);
 * - `If-Match`: the `version` of the week the leader saw, so a week another
 *   leader changed meanwhile answers 409 instead of being overwritten;
 * - `confirmed`: the leader accepted the big warning for a person who lacks
 *   what the place needs. The browser adds `Origin` itself.
 *
 * Personal refuses with `{ detail }` in Norwegian; that text is shown as is,
 * and the page then reloads the week (see `execute` in App.svelte).
 */
export function createHttpApi(fetchFn: typeof fetch = fetch): LeaderApi {
  let csrfToken = ""

  async function refreshToken(): Promise<void> {
    const response = await fetchFn(`${BASE}/me`, { credentials: "same-origin" })
    csrfToken = (await readJson<LeaderMe>(response)).csrf_token
  }

  async function write(
    method: "POST" | "PUT" | "DELETE",
    path: string,
    board: WeekBoard,
    options: {
      body?: unknown
      query?: Record<string, string>
      week?: boolean
    } = {},
  ): Promise<WriteResult> {
    const query = new URLSearchParams({
      group_id: String(board.bar.id),
      ...(options.week === false ? {} : { week_start: board.week_start }),
      ...options.query,
    })
    const send = () =>
      fetchFn(`${BASE}${path}?${query}`, {
        method,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          "If-Match": board.version,
        },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
      })
    let response = await send()
    // A 403 can mean the security code ran out. Ask for a fresh one once and
    // try again; if the code is the same, the 403 is a real refusal (for
    // example a bar outside the leader's scope) and is shown as it is.
    if (response.status === 403) {
      const sent = csrfToken
      try {
        await refreshToken()
      } catch (error) {
        if (error instanceof NotSignedInError) throw error
      }
      if (csrfToken !== sent) response = await send()
    }
    const result = await readJson<WireWriteResult>(response)
    return {
      message: result.message,
      warnings: result.warnings,
      board: toBoard(result.board),
    }
  }

  /** The assignment's place in Personal's terms (the slot, not the box). */
  function slotOfAssignment(board: WeekBoard, assignmentId: number): number {
    for (const shift of board.shifts)
      for (const place of shift.places)
        if (place.assignment?.assignment_id === assignmentId)
          return realSlot(place.slot_id)
    throw new RefusedError("Plassen finnes ikke lenger. Siden oppdateres.")
  }

  return {
    async me(): Promise<LeaderMe> {
      const response = await fetchFn(`${BASE}/me`, {
        credentials: "same-origin",
      })
      const me = await readJson<LeaderMe>(response)
      csrfToken = me.csrf_token
      return me
    },
    async week(groupId: number, weekStart: string): Promise<WeekBoard> {
      const response = await fetchFn(
        `${BASE}/weeks/${weekStart}?group_id=${groupId}`,
        { credentials: "same-origin" },
      )
      return toBoard(await readJson<WireBoard>(response))
    },
    place: (board, slotId, volunteerId, confirmed = false) =>
      write("POST", "/placements", board, {
        body: {
          slot_id: realSlot(slotId),
          volunteer_id: volunteerId,
          confirmed,
        },
      }),
    replace: async (board, assignmentId, volunteerId, confirmed = false) =>
      write("PUT", `/placements/${assignmentId}`, board, {
        body: {
          slot_id: slotOfAssignment(board, assignmentId),
          volunteer_id: volunteerId,
          confirmed,
        },
      }),
    move: (board, assignmentId, toSlotId, confirmed = false) =>
      write("POST", `/placements/${assignmentId}/move`, board, {
        body: { slot_id: realSlot(toSlotId), confirmed },
      }),
    swap: (board, a, b) =>
      write("POST", "/placements/swap", board, {
        body: { assignment_a: a, assignment_b: b, confirmed: false },
      }),
    remove: async (board, assignmentId) =>
      write("DELETE", `/placements/${assignmentId}`, board, {
        query: { slot_id: String(slotOfAssignment(board, assignmentId)) },
      }),
    addPlace: (board, shiftId, kind) =>
      write("POST", `/shifts/${shiftId}/places`, board, { body: { kind } }),
    removePlace: (board, slotId) =>
      write("DELETE", `/slots/${realSlot(slotId)}/seat`, board),
    setStatus: (board, status) =>
      write("PUT", `/weeks/${board.week_start}/status`, board, {
        body: { status },
        week: false,
      }),
  }
}

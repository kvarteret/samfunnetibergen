/**
 * The leader API this app needs from Personal, written as the shapes the app
 * expects. Personal does not have these endpoints yet; the prototype serves
 * them from `fake.ts`. When Personal adds them (tag `leader-shifts`, prefix
 * `/api/v1/leader/shifts`), these hand-written types are replaced by a client
 * generated from Personal's openapi.json, like the app repo does for the
 * `mobile-shifts` tag.
 *
 * Rules stay on the server: who fits which place, warnings and refusals all
 * come in the response. The app only shows them and never re-implements a
 * rule. Every write returns the refreshed week, so the app never has to
 * patch its own copy.
 */

/** A shift's answer from one person. Missing means "ikke svart". */
export type Answer = "vil" | "kan" | "nei"

/** How far a person has come with the week (S2 adds "ferdig"). */
export type AnswerStatus = "ikke_svart" | "paabegynt" | "ferdig"

export type WeekStatus = "open" | "published" | "changed_after_publish"

export type PlaceKind =
  | "skiftleder"
  | "skjenker"
  | "bartender"
  | "kokk"
  | "opplaering"
  | "garderobe"

export type Level = "red" | "yellow"

export interface Note {
  text: string
  level: Level
}

/** GET /me: who is signed in and which bars they may plan. */
export interface LeaderMe {
  name: string
  role: "Admin" | "Gruppeadmin"
  /** Personal's CSRF token, sent back as X-CSRF-Token on every write. */
  csrf_token: string
  bars: { id: number; name: string }[]
}

export interface Assignment {
  assignment_id: number
  volunteer_id: number
  cannot_attend: boolean
  swap_requested: boolean
  /** "opplæring 2/3" once 5d step 3 is built, else null. */
  training: string | null
  /** The person's problems on this place, worded by the server. */
  problems: Note[]
}

export interface Place {
  slot_id: number
  kind: PlaceKind
  /** Null when the place is empty or the person said "kan ikke i dag". */
  assignment: Assignment | null
  /** L3: a pending suggestion, never visible in the volunteer app. */
  suggestion: { volunteer_id: number; why: string } | null
  /**
   * The place still has to be filled for the shift to be staffed: empty (or
   * "kan ikke i dag"), shift open, and not an Opplæring place (a trainee is
   * an extra). The "ledige" count is the number of these. Missing means
   * "same as empty" (the prototype's fake data).
   */
  needed?: boolean
}

export interface Shift {
  shift_id: number
  /** Oslo date the shift belongs to, ISO yyyy-mm-dd. */
  day: string
  /** 1-based position in the bar's day (1. skift, 2. skift ...). */
  position: number
  title: string
  /** Real times with offset, e.g. "2026-12-01T16:30:00+01:00". */
  starts_at?: string | null
  ends_at?: string | null
  /** Planned length in minutes; counts a shift past midnight correctly. */
  duration_minutes?: number | null
  /** "16:30–22:00", already formatted by the server. */
  time_label: string
  closed: boolean
  places: Place[]
  /** volunteer id -> answer, only for people in the leader's pool. */
  answers: Record<string, Answer>
}

export interface Person {
  volunteer_id: number
  name: string
  is_skiftleder: boolean
  week_shifts: number
  month_shifts: number
  /** Planned minutes this week on shifts the person is coming to. */
  week_minutes: number
  answer_status: AnswerStatus
  /** ISO days this week with a shift in any group. */
  busy_days: string[]
  /** From the weekly table in S2; null until then. */
  note: string | null
  max_shifts: number | null
  /** Short server-made tags, e.g. "avtalt 1/mnd", "borte til 30. nov". */
  tags: string[]
}

/** Whether a person fits an open place, and what to warn about. */
export type Fit =
  | {
      ok: true
      warnings: Note[]
      /**
       * The person lacks what the place needs (for example the skiftleder
       * approval). The leader may still place them, but only after a popup
       * with the red warning is confirmed.
       */
      needs_confirmation?: boolean
    }
  | { ok: false; reason: string }

export interface WeekStripItem {
  week_start: string
  number: number
  status: WeekStatus
}

/** GET /weeks/{week_start}?group_id= */
export interface WeekBoard {
  bar: { id: number; name: string }
  week_start: string
  week_number: number
  /** Changes on every write to the week; sent back as If-Match. */
  version: string
  status: WeekStatus
  /** "Svarfrist" for this week, null until the weekly deadline (S2). */
  deadline: string | null
  /** Rows of the grid: one per position in the bar's day. */
  rows: { position: number; label: string; time_label: string }[]
  shifts: Shift[]
  people: Person[]
  /** volunteer id -> slot id -> fit. Only open places are listed. */
  fit: Record<string, Record<string, Fit>>
  strip: WeekStripItem[]
  /** Set when another leader changed the week after this copy was read. */
  last_changed: { by: string; at: string } | null
}

/** Every write answers with this, or 409 with { detail }. */
export interface WriteResult {
  message: string
  warnings: Note[]
  board: WeekBoard
}

/** A refused write. `detail` is Norwegian and shown as is. */
export class RefusedError extends Error {}

/**
 * The calls the app makes. `fake.ts` implements this for the prototype; the
 * real one wraps the generated client and the `/personal` proxy path.
 */
export interface LeaderApi {
  me(): Promise<LeaderMe>
  week(groupId: number, weekStart: string): Promise<WeekBoard>
  /**
   * POST /placements. `confirmed` says the leader accepted the big warning
   * for a person who lacks the qualification; without it the server refuses
   * such a placement.
   */
  place(
    board: WeekBoard,
    slotId: number,
    volunteerId: number,
    confirmed?: boolean,
  ): Promise<WriteResult>
  /** PUT /placements/{assignment_id}: another person in the same place. */
  replace(
    board: WeekBoard,
    assignmentId: number,
    volunteerId: number,
    confirmed?: boolean,
  ): Promise<WriteResult>
  /** POST /placements/{assignment_id}/move: to an empty place. */
  move(
    board: WeekBoard,
    assignmentId: number,
    toSlotId: number,
    confirmed?: boolean,
  ): Promise<WriteResult>
  /** POST /placements/swap: two placed people change places, atomically. */
  swap(board: WeekBoard, a: number, b: number): Promise<WriteResult>
  /** DELETE /placements/{assignment_id} */
  remove(board: WeekBoard, assignmentId: number): Promise<WriteResult>
  /** POST /shifts/{shift_id}/places: one more place of a kind ("+"). */
  addPlace(
    board: WeekBoard,
    shiftId: number,
    kind: PlaceKind,
  ): Promise<WriteResult>
  /** DELETE /slots/{slot_id}/seat: one EMPTY place less ("−"). */
  removePlace(board: WeekBoard, slotId: number): Promise<WriteResult>
  /** PUT /weeks/{week_start}/status */
  setStatus(
    board: WeekBoard,
    status: "open" | "published",
  ): Promise<WriteResult>
}

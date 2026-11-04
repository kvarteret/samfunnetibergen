/**
 * Pure helpers that turn a WeekBoard into what the screen shows. No rules
 * live here: fit, warnings and problems come from the server; this only
 * groups, counts, sorts and words them.
 */

import { addDays } from "./fake"
import { type Op, occupant } from "./ops"
import type {
  Answer,
  Fit,
  Note,
  Person,
  Place,
  PlaceKind,
  Shift,
  WeekBoard,
  WeekStatus,
} from "./types"

export const DAY_NAMES = [
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
  "Søndag",
]

export const ANSWER_WORD: Record<Answer | "none", string> = {
  vil: "vil",
  kan: "kan",
  nei: "kan ikke",
  none: "ikke svart",
}

export const KIND_LABEL: Record<PlaceKind, string> = {
  skiftleder: "Skiftleder",
  skjenker: "Skjenker",
  bartender: "Bartender",
  kokk: "Kokk",
  opplaering: "Opplæring",
  garderobe: "Garderobe",
}

/**
 * What "−" and "+" are shown for on every shift: Skjenker in the bars, and
 * Kokk where the bar has kokk places this week (the kitchen). Never Skiftleder (every shift has
 * exactly one) or Opplæring (a mode of a place, not a kind). No other roles
 * for now; Personal refuses them too.
 */
export function addableKinds(board: WeekBoard): PlaceKind[] {
  const kitchen = board.shifts.some(shift =>
    shift.places.some(place => place.kind === "kokk"),
  )
  return [kitchen ? "kokk" : "skjenker"]
}

export const STATUS_TEXT: Record<WeekStatus, string> = {
  open: "Utkast: ikke synlig for frivillige",
  published: "Publisert",
  changed_after_publish: "Endret etter publisering",
}

/** "Sist endret av Kari, kl. 14:05." from the server's last_changed, in Oslo time. */
export function changedBy(changed: { by: string; at: string } | null): string {
  if (!changed) return ""
  const time = new Date(changed.at).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  })
  return `Sist endret av ${changed.by}, kl. ${time}.`
}

export function firstName(name: string): string {
  return name.split(" ")[0]
}

const MONTHS = [
  "januar",
  "februar",
  "mars",
  "april",
  "mai",
  "juni",
  "juli",
  "august",
  "september",
  "oktober",
  "november",
  "desember",
]

/**
 * "30. november". Full month names on purpose: screen readers read
 * abbreviations like "nov." badly, and the columns have room for the
 * full word.
 */
export function longDate(iso: string): string {
  const [, month, day] = iso.split("-").map(Number)
  return `${day}. ${MONTHS[month - 1]}`
}

export function weekDays(board: WeekBoard): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    addDays(board.week_start, index),
  )
}

export function weekLabel(board: WeekBoard): string {
  const days = weekDays(board)
  return `Uke ${board.week_number} (${longDate(days[0])}–${longDate(days[6])})`
}

export function dayLabel(iso: string): string {
  const index = (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7
  return `${DAY_NAMES[index].toLowerCase()} ${longDate(iso)}`
}

export function shiftAt(
  board: WeekBoard,
  day: string,
  position: number,
): Shift | undefined {
  return board.shifts.find(
    shift => shift.day === day && shift.position === position,
  )
}

export function isOpen(place: Place): boolean {
  return !place.assignment || place.assignment.cannot_attend
}

/** A place that must still be filled (see `Place.needed`). */
export function isNeeded(place: Place): boolean {
  return place.needed ?? isOpen(place)
}

export function levelOf(notes: Note[]): "red" | "yellow" | null {
  if (notes.some(note => note.level === "red")) return "red"
  return notes.length ? "yellow" : null
}

export function answerOf(shift: Shift, volunteerId: number): Answer | null {
  return shift.answers[volunteerId] ?? null
}

export function personById(board: WeekBoard, id: number): Person | undefined {
  return board.people.find(person => person.volunteer_id === id)
}

export function fitOf(
  board: WeekBoard,
  volunteerId: number,
  slotId: number,
): Fit | null {
  return board.fit[volunteerId]?.[slotId] ?? null
}

export interface PlaceRef {
  shift: Shift
  place: Place
}

export function allPlaces(board: WeekBoard): PlaceRef[] {
  return [...board.shifts]
    .sort((a, b) => a.day.localeCompare(b.day) || a.position - b.position)
    .flatMap(shift => shift.places.map(place => ({ shift, place })))
}

export function placeRef(board: WeekBoard, slotId: number): PlaceRef | null {
  return allPlaces(board).find(ref => ref.place.slot_id === slotId) ?? null
}

export function placeName(ref: PlaceRef): string {
  return `${KIND_LABEL[ref.place.kind]}, ${dayLabel(ref.shift.day)}, ${ref.shift.title.toLowerCase()}`
}

export interface Summary {
  /** Places with at least one red problem. */
  problems: PlaceRef[]
  /** Places with only yellow warnings. */
  warnings: PlaceRef[]
  /** Places that must still be filled: the "ledige" chip. */
  open: PlaceRef[]
  /** Places whose person asked for a swap. */
  swaps: PlaceRef[]
  /** Places whose person said "kan ikke i dag": a replacement is needed. */
  sick: PlaceRef[]
  withoutShift: Person[]
  answered: number
  notAnswered: Person[]
}

export function summarize(board: WeekBoard): Summary {
  const places = allPlaces(board)
  return {
    problems: places.filter(
      ref =>
        !isOpen(ref.place) &&
        levelOf(ref.place.assignment?.problems ?? []) === "red",
    ),
    warnings: places.filter(
      ref =>
        !isOpen(ref.place) &&
        levelOf(ref.place.assignment?.problems ?? []) === "yellow",
    ),
    open: places.filter(ref => isNeeded(ref.place)),
    swaps: places.filter(
      ref =>
        ref.place.assignment?.swap_requested &&
        !ref.place.assignment.cannot_attend,
    ),
    sick: places.filter(ref => ref.place.assignment?.cannot_attend),
    withoutShift: board.people.filter(
      person => person.answer_status !== "ikke_svart" && !person.week_shifts,
    ),
    answered: board.people.filter(
      person => person.answer_status !== "ikke_svart",
    ).length,
    notAnswered: board.people.filter(
      person => person.answer_status === "ikke_svart",
    ),
  }
}

export type Filter = "alle" | "uten_skift" | "skiftledere" | "ikke_svart"

export const FILTERS: { key: Filter; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "uten_skift", label: "Uten skift" },
  { key: "skiftledere", label: "Skiftledere" },
  { key: "ikke_svart", label: "Ikke svart" },
]

/**
 * Lowercase with accents removed, like the Jinja page's search: "å" folds to
 * "a", while "æ" and "ø" have no accent to remove and stay distinct.
 */
export function fold(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
}

export function matches(name: string, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean)
  const folded = fold(name)
  return words.every(word => folded.includes(word))
}

const RANK: Record<Answer | "none", number> = {
  vil: 0,
  kan: 1,
  none: 2,
  nei: 3,
}

/** The best answer a person gave for any shift that day. */
export function dayAnswer(
  board: WeekBoard,
  day: string,
  volunteerId: number,
): Answer | "none" | null {
  const shifts = board.shifts.filter(shift => shift.day === day)
  if (!shifts.length) return null
  return shifts
    .map(shift => answerOf(shift, volunteerId) ?? "none")
    .reduce((best, answer) => (RANK[answer] < RANK[best] ? answer : best))
}

export function filterPeople(
  board: WeekBoard,
  query: string,
  filter: Filter,
  focusDay: string | null,
): Person[] {
  return board.people
    .filter(person => matches(person.name, query))
    .filter(
      person =>
        filter === "alle" ||
        (filter === "uten_skift" &&
          person.answer_status !== "ikke_svart" &&
          person.week_shifts === 0) ||
        (filter === "skiftledere" && person.is_skiftleder) ||
        (filter === "ikke_svart" && person.answer_status === "ikke_svart"),
    )
    .sort((a, b) => {
      if (focusDay) {
        const rankA = RANK[dayAnswer(board, focusDay, a.volunteer_id) ?? "none"]
        const rankB = RANK[dayAnswer(board, focusDay, b.volunteer_id) ?? "none"]
        if (rankA !== rankB) return rankA - rankB
      }
      return (
        a.week_shifts - b.week_shifts ||
        a.month_shifts - b.month_shifts ||
        a.name.localeCompare(b.name, "nb")
      )
    })
}

export interface Candidate {
  person: Person
  answer: Answer | "none"
  fit: Fit
}

/** "6 t" or "6 t 30 min": planned hours from minutes. */
export function hoursText(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} t ${rest} min` : `${hours} t`
}

/** What the leader must confirm before an action, or null if nothing. */
export interface Confirmation {
  person: Person
  place: PlaceRef
  /** One sentence naming the person and the place and why we ask. */
  subject: string
  warnings: Note[]
}

/**
 * The popup case: placing a person the server marked `needs_confirmation`,
 * who answered "kan ikke" for the shift, or whom the server warns about in
 * red (and the leader has not confirmed yet). Swaps and undo actions never ask.
 */
export function confirmationFor(board: WeekBoard, op: Op): Confirmation | null {
  if (op.type !== "place" && op.type !== "replace" && op.type !== "move")
    return null
  if (op.confirmed) return null
  const slotId = op.type === "move" ? op.toSlotId : op.slotId
  const volunteerId =
    op.type === "move" ? occupant(board, op.fromSlotId) : op.volunteerId
  if (volunteerId === null) return null
  const fit = fitOf(board, volunteerId, slotId)
  const person = personById(board, volunteerId)
  const place = placeRef(board, slotId)
  if (!fit?.ok || !person || !place) return null
  const refused = answerOf(place.shift, volunteerId) === "nei"
  const warnings: Note[] = [...fit.warnings]
  // The server may already warn about the answer; say it once.
  const alreadySaid = warnings.some(note => /kan ikke/i.test(note.text))
  if (refused && !alreadySaid)
    warnings.unshift({
      text: "Svarte «kan ikke» for dette skiftet.",
      level: "red",
    })
  const mustAsk =
    fit.needs_confirmation === true ||
    refused ||
    warnings.some(note => note.level === "red")
  if (!mustAsk) return null
  const subject = fit.needs_confirmation
    ? `${person.name} har ikke det som trengs for ${placeName(place)}.`
    : `Sjekk advarslene før du setter inn ${person.name}: ${placeName(place)}.`
  return { person, place, subject, warnings }
}

/**
 * People for one place, grouped like the L2a picker: vil, kan, ikke svart,
 * kan ikke last; inside each group fewer shifts first. People the server says
 * do not fit at all are left out (the reason shows in the grid instead).
 * People who may be placed only after a confirmation form their own last
 * group, "unqualified".
 */
export function candidates(
  board: WeekBoard,
  ref: PlaceRef,
): Record<Answer | "none" | "unqualified", Candidate[]> {
  const groups: Record<Answer | "none" | "unqualified", Candidate[]> = {
    vil: [],
    kan: [],
    none: [],
    nei: [],
    unqualified: [],
  }
  const slotId = ref.place.slot_id
  // The person on the place is never their own replacement, also not when
  // they said "kan ikke i dag".
  const current = ref.place.assignment?.volunteer_id ?? null
  for (const person of board.people) {
    if (person.volunteer_id === current) continue
    const fit =
      fitOf(board, person.volunteer_id, slotId) ?? replaceFit(ref, person)
    if (!fit?.ok) continue
    const answer = answerOf(ref.shift, person.volunteer_id) ?? "none"
    // People who lack what the place needs come last, behind a popup.
    groups[fit.needs_confirmation ? "unqualified" : answer].push({
      person,
      answer,
      fit,
    })
  }
  for (const list of Object.values(groups)) {
    list.sort(
      (a, b) =>
        a.person.week_shifts - b.person.week_shifts ||
        a.person.month_shifts - b.person.month_shifts ||
        a.person.name.localeCompare(b.person.name, "nb"),
    )
  }
  return groups
}

/**
 * For a filled place the server gives no fit (it is not open). The real API
 * returns candidates for "Bytt person" from GET .../places/{slot}/candidates;
 * the prototype approximates it with the skiftleder rule only.
 */
function replaceFit(ref: PlaceRef, person: Person): Fit {
  if (ref.place.kind === "skiftleder" && !person.is_skiftleder)
    return { ok: false, reason: "bare godkjente skiftledere" }
  if (
    ref.shift.places.some(
      place => place.assignment?.volunteer_id === person.volunteer_id,
    )
  )
    return { ok: false, reason: "allerede på dette skiftet" }
  const warnings: Note[] = []
  if (answerOf(ref.shift, person.volunteer_id) === "nei")
    warnings.push({ text: "svarte kan ikke", level: "red" })
  if (person.busy_days.includes(ref.shift.day))
    warnings.push({ text: "har skift samme dag", level: "red" })
  return { ok: true, warnings }
}

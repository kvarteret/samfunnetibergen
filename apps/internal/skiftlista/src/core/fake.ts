/**
 * A fake Personal for the prototype: invented people, in memory, reset on
 * reload. It answers in the shapes of `types.ts` and plays the server's part
 * (fit, warnings, refusals), so the UI can be built and tried without a real
 * server. The rules here are a small stand-in for Personal's own
 * (`week_picker.py`, `ShiftsService`); they are not a second copy to keep.
 */

import {
  type Answer,
  type AnswerStatus,
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

interface ShiftTemplate {
  title: string
  time: [string, string]
  kinds: PlaceKind[]
  weekdays: number[]
}

interface BarSeed {
  id: number
  name: string
  people: string[]
  skiftledere: string[]
  /** People from this index on have not answered at all. */
  answered: number
  templates: ShiftTemplate[]
}

const BARS: BarSeed[] = [
  {
    id: 11,
    name: "Stjerne",
    people: [
      "Ada B.",
      "Ola N.",
      "Sara H.",
      "Even M.",
      "Kari B.",
      "Tuva R.",
      "Iver K.",
      "Nora J.",
      "Live H.",
      "Jonas L.",
      "Mia S.",
      "Emil T.",
      "Ingrid V.",
      "Sander P.",
      "Thea A.",
      "Henrik F.",
    ],
    skiftledere: ["Ada B.", "Even M.", "Iver K.", "Jonas L.", "Henrik F."],
    answered: 13,
    templates: [
      {
        title: "Dagskift",
        time: ["11:30", "17:00"],
        kinds: ["skiftleder", "skjenker"],
        weekdays: [0, 1, 2, 3, 4],
      },
      {
        title: "Kveldsskift",
        time: ["16:30", "22:00"],
        kinds: ["skiftleder", "skjenker", "skjenker"],
        weekdays: [0, 1, 2, 3, 4],
      },
    ],
  },
  {
    id: 12,
    name: "Grøndahls",
    people: [
      "Eira M.",
      "Gustav I.",
      "Hedda E.",
      "Kasper B.",
      "Frida L.",
      "Jenny G.",
      "Pernille H.",
      "Didrik M.",
      "Selma K.",
      "Vilde O.",
      "Mathias R.",
      "Sofie N.",
    ],
    skiftledere: ["Kasper B.", "Pernille H.", "Mathias R."],
    answered: 9,
    templates: [
      {
        title: "Pub",
        time: ["19:30", "01:30"],
        kinds: ["skiftleder", "skjenker", "skjenker"],
        weekdays: [0, 1, 2, 3, 4, 5],
      },
    ],
  },
]

/** The first Monday the fake knows about; three weeks from here. */
export const FIRST_WEEK = "2026-11-30"
const WEEK_COUNT = 3

const MONTHS = [
  "jan.",
  "feb.",
  "mars",
  "apr.",
  "mai",
  "juni",
  "juli",
  "aug.",
  "sep.",
  "okt.",
  "nov.",
  "des.",
]

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function isoWeekNumber(iso: string): number {
  const date = new Date(`${iso}T12:00:00Z`)
  const weekday = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - weekday + 3)
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const diff = (date.getTime() - firstThursday.getTime()) / 86400000
  return 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
}

export function shortDate(iso: string): string {
  const [, month, day] = iso.split("-").map(Number)
  return `${day}. ${MONTHS[month - 1]}`
}

interface StoredPlace {
  slot_id: number
  kind: PlaceKind
  assignment: Omit<Assignment, "problems"> | null
}

interface StoredShift {
  shift_id: number
  bar_id: number
  day: string
  position: number
  title: string
  time: [string, string]
  places: StoredPlace[]
}

interface StoredPerson {
  volunteer_id: number
  bar_id: number
  name: string
  is_skiftleder: boolean
  answered: boolean
}

interface Store {
  shifts: StoredShift[]
  people: StoredPerson[]
  answers: Map<string, Answer>
  status: Map<string, WeekStatus>
  version: Map<string, number>
  changed: Map<string, { by: string; at: string }>
  nextId: number
}

function hash(...parts: number[]): number {
  let h = 2166136261
  for (const part of parts) {
    h ^= part
    h = Math.imul(h, 16777619) >>> 0
  }
  return h % 100
}

function answerKey(shiftId: number, volunteerId: number): string {
  return `${shiftId}:${volunteerId}`
}

function weekKey(barId: number, weekStart: string): string {
  return `${barId}|${weekStart}`
}

export function createStore(): Store {
  const store: Store = {
    shifts: [],
    people: [],
    answers: new Map(),
    status: new Map(),
    version: new Map(),
    changed: new Map(),
    nextId: 1000,
  }
  let personId = 100
  let shiftId = 500
  let slotId = 5000
  for (const bar of BARS) {
    bar.people.forEach((name, index) => {
      store.people.push({
        volunteer_id: personId++,
        bar_id: bar.id,
        name,
        is_skiftleder: bar.skiftledere.includes(name),
        answered: index < bar.answered,
      })
    })
    for (let week = 0; week < WEEK_COUNT; week++) {
      for (let weekday = 0; weekday < 7; weekday++) {
        const day = addDays(FIRST_WEEK, week * 7 + weekday)
        bar.templates.forEach((template, index) => {
          if (!template.weekdays.includes(weekday)) return
          store.shifts.push({
            shift_id: shiftId++,
            bar_id: bar.id,
            day,
            position: index + 1,
            title: template.title,
            time: template.time,
            places: template.kinds.map(kind => ({
              slot_id: slotId++,
              kind,
              assignment: null,
            })),
          })
        })
      }
    }
  }
  for (const shift of store.shifts) {
    for (const person of store.people) {
      if (person.bar_id !== shift.bar_id || !person.answered) continue
      const roll = hash(shift.shift_id, person.volunteer_id)
      const answer: Answer | null =
        roll < 28 ? "vil" : roll < 50 ? "kan" : roll < 85 ? "nei" : null
      if (answer)
        store.answers.set(
          answerKey(shift.shift_id, person.volunteer_id),
          answer,
        )
    }
  }
  seedPlacements(store)
  return store
}

/** A half-planned first week, with one red problem and one sick person. */
function seedPlacements(store: Store) {
  const firstWeekEnd = addDays(FIRST_WEEK, 3)
  const placedCount = new Map<number, number>()
  for (const shift of store.shifts) {
    if (shift.day >= firstWeekEnd) continue
    const used = new Set(
      store.shifts
        .filter(other => other.day === shift.day)
        .flatMap(other => other.places)
        .flatMap(place =>
          place.assignment ? [place.assignment.volunteer_id] : [],
        ),
    )
    for (const place of shift.places) {
      // Fewest shifts so far first, so the seeded week looks like a fair plan.
      const pick = store.people
        .filter(
          person =>
            person.bar_id === shift.bar_id &&
            !used.has(person.volunteer_id) &&
            (place.kind !== "skiftleder" || person.is_skiftleder) &&
            store.answers.get(
              answerKey(shift.shift_id, person.volunteer_id),
            ) === "vil",
        )
        .sort(
          (a, b) =>
            (placedCount.get(a.volunteer_id) ?? 0) -
            (placedCount.get(b.volunteer_id) ?? 0),
        )[0]
      if (!pick) continue
      used.add(pick.volunteer_id)
      placedCount.set(
        pick.volunteer_id,
        (placedCount.get(pick.volunteer_id) ?? 0) + 1,
      )
      place.assignment = newAssignment(store, pick.volunteer_id)
    }
  }
  // One red problem: someone who answered "kan ikke" placed on Wednesday.
  const wednesday = store.shifts.find(
    shift =>
      shift.bar_id === 11 &&
      shift.day === addDays(FIRST_WEEK, 2) &&
      shift.position === 1,
  )
  const target = wednesday?.places.find(place => place.kind === "skjenker")
  const refuser = store.people.find(
    person =>
      person.bar_id === 11 &&
      !person.is_skiftleder &&
      wednesday &&
      !placedCount.has(person.volunteer_id) &&
      store.answers.get(answerKey(wednesday.shift_id, person.volunteer_id)) ===
        "nei",
  )
  if (target && refuser)
    target.assignment = newAssignment(store, refuser.volunteer_id)
  // One "kan ikke i dag": the place counts as open, the person stays marked.
  const monday = store.shifts.find(
    shift => shift.bar_id === 11 && shift.day === FIRST_WEEK,
  )
  const sick = monday?.places.find(
    place => place.assignment && place.kind === "skjenker",
  )
  if (sick?.assignment) sick.assignment.cannot_attend = true
}

function newAssignment(
  store: Store,
  volunteerId: number,
): Omit<Assignment, "problems"> {
  return {
    assignment_id: store.nextId++,
    volunteer_id: volunteerId,
    cannot_attend: false,
    swap_requested: false,
    training: null,
  }
}

function weekShifts(
  store: Store,
  barId: number,
  weekStart: string,
): StoredShift[] {
  const end = addDays(weekStart, 7)
  return store.shifts.filter(
    shift =>
      shift.bar_id === barId && shift.day >= weekStart && shift.day < end,
  )
}

/** Shifts each person has per day this week (all bars, like Personal counts). */
function dayCounts(store: Store, weekStart: string): Map<string, number> {
  const end = addDays(weekStart, 7)
  const counts = new Map<string, number>()
  for (const shift of store.shifts) {
    if (shift.day < weekStart || shift.day >= end) continue
    for (const place of shift.places) {
      if (!place.assignment || place.assignment.cannot_attend) continue
      const key = `${place.assignment.volunteer_id}|${shift.day}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return counts
}

function weekCount(counts: Map<string, number>, volunteerId: number): number {
  let total = 0
  for (const [key, count] of counts) {
    if (key.startsWith(`${volunteerId}|`)) total += count
  }
  return total
}

function problemsFor(
  store: Store,
  shift: StoredShift,
  volunteerId: number,
  counts: Map<string, number>,
  cannotAttend: boolean,
): Note[] {
  const notes: Note[] = []
  if (cannotAttend) notes.push({ text: "kan ikke i dag", level: "red" })
  if (store.answers.get(answerKey(shift.shift_id, volunteerId)) === "nei")
    notes.push({ text: "svarte kan ikke", level: "red" })
  if ((counts.get(`${volunteerId}|${shift.day}`) ?? 0) > 1)
    notes.push({ text: "to skift samme dag", level: "red" })
  const total = weekCount(counts, volunteerId)
  if (total > 1)
    notes.push({ text: `${total} skift denne uka`, level: "yellow" })
  return notes
}

function fitFor(
  store: Store,
  shift: StoredShift,
  place: StoredPlace,
  person: StoredPerson,
  counts: Map<string, number>,
): Fit {
  if (
    shift.places.some(
      other =>
        other.assignment?.volunteer_id === person.volunteer_id &&
        !other.assignment.cannot_attend,
    )
  )
    return { ok: false, reason: "allerede på dette skiftet" }
  const warnings: Note[] = []
  // Like Personal: a missing approval is not a refusal. The leader may place
  // the person after confirming a big red warning.
  const lacksApproval = place.kind === "skiftleder" && !person.is_skiftleder
  if (lacksApproval)
    warnings.push({ text: "bare godkjente skiftledere", level: "red" })
  if (
    store.answers.get(answerKey(shift.shift_id, person.volunteer_id)) === "nei"
  )
    warnings.push({ text: "svarte kan ikke", level: "red" })
  if ((counts.get(`${person.volunteer_id}|${shift.day}`) ?? 0) > 0)
    warnings.push({ text: "har skift samme dag", level: "red" })
  const total = weekCount(counts, person.volunteer_id)
  if (total > 0)
    warnings.push({
      text: `skift nummer ${total + 1} denne uka`,
      level: "yellow",
    })
  return lacksApproval
    ? { ok: true, warnings, needs_confirmation: true }
    : { ok: true, warnings }
}

/** "22:00" to "02:00" is 4 hours: a shift past midnight ends the next day. */
export function minutesBetween(start: string, end: string): number {
  const minutes = (time: string) => {
    const [hours, rest] = time.split(":").map(Number)
    return hours * 60 + rest
  }
  const diff = minutes(end) - minutes(start)
  return diff > 0 ? diff : diff + 24 * 60
}

function statusFor(store: Store, barId: number, weekStart: string): WeekStatus {
  return store.status.get(weekKey(barId, weekStart)) ?? "open"
}

export function buildBoard(
  store: Store,
  barId: number,
  weekStart: string,
): WeekBoard {
  const bar = BARS.find(candidate => candidate.id === barId)
  if (!bar) throw new RefusedError("Fant ikke baren.")
  const shifts = weekShifts(store, barId, weekStart)
  const counts = dayCounts(store, weekStart)
  const pool = store.people.filter(person => person.bar_id === barId)
  const monthShifts = (volunteerId: number) =>
    store.shifts.filter(
      shift =>
        shift.day.slice(0, 7) === weekStart.slice(0, 7) &&
        shift.places.some(
          place => place.assignment?.volunteer_id === volunteerId,
        ),
    ).length

  const boardShifts: Shift[] = shifts.map(shift => {
    const answers: Record<string, Answer> = {}
    for (const person of pool) {
      const answer = store.answers.get(
        answerKey(shift.shift_id, person.volunteer_id),
      )
      if (answer) answers[person.volunteer_id] = answer
    }
    const places: Place[] = shift.places.map(place => ({
      slot_id: place.slot_id,
      kind: place.kind,
      assignment: place.assignment
        ? {
            ...place.assignment,
            problems: problemsFor(
              store,
              shift,
              place.assignment.volunteer_id,
              counts,
              place.assignment.cannot_attend,
            ),
          }
        : null,
      suggestion: null,
    }))
    return {
      shift_id: shift.shift_id,
      day: shift.day,
      position: shift.position,
      title: shift.title,
      starts_at: `${shift.day}T${shift.time[0]}`,
      ends_at: `${shift.day}T${shift.time[1]}`,
      time_label: `${shift.time[0]}–${shift.time[1]}`,
      duration_minutes: minutesBetween(shift.time[0], shift.time[1]),
      closed: false,
      places,
      answers,
    }
  })

  const people: Person[] = pool.map(person => {
    const answered = boardShifts.some(
      shift => shift.answers[person.volunteer_id],
    )
    const status: AnswerStatus = answered ? "paabegynt" : "ikke_svart"
    const busy = new Set<string>()
    for (const [key, count] of counts) {
      const [id, day] = key.split("|")
      if (Number(id) === person.volunteer_id && count > 0) busy.add(day)
    }
    return {
      volunteer_id: person.volunteer_id,
      name: person.name,
      is_skiftleder: person.is_skiftleder,
      week_shifts: weekCount(counts, person.volunteer_id),
      month_shifts: monthShifts(person.volunteer_id),
      week_minutes: shifts
        .filter(shift =>
          shift.places.some(
            place =>
              place.assignment?.volunteer_id === person.volunteer_id &&
              !place.assignment.cannot_attend,
          ),
        )
        .reduce(
          (sum, shift) => sum + minutesBetween(shift.time[0], shift.time[1]),
          0,
        ),
      answer_status: status,
      busy_days: [...busy].sort(),
      note: person.volunteer_id % 7 === 0 ? "Eksamen torsdag" : null,
      max_shifts: person.volunteer_id % 5 === 0 ? 1 : null,
      tags: person.volunteer_id % 11 === 0 ? ["avtalt 1/mnd"] : [],
    }
  })

  const fit: WeekBoard["fit"] = {}
  for (const person of pool) {
    const perSlot: Record<string, Fit> = {}
    for (const shift of shifts) {
      for (const place of shift.places) {
        if (place.assignment && !place.assignment.cannot_attend) continue
        perSlot[place.slot_id] = fitFor(store, shift, place, person, counts)
      }
    }
    fit[person.volunteer_id] = perSlot
  }

  const positions = [...new Set(shifts.map(shift => shift.position))].sort()
  return {
    bar: { id: bar.id, name: bar.name },
    week_start: weekStart,
    week_number: isoWeekNumber(weekStart),
    version: String(store.version.get(weekKey(barId, weekStart)) ?? 0),
    status: statusFor(store, barId, weekStart),
    deadline: addDays(weekStart, -7),
    rows: positions.map(position => {
      const template = bar.templates[position - 1]
      return {
        position,
        label: template.title,
        time_label: `${template.time[0]}–${template.time[1]}`,
      }
    }),
    shifts: boardShifts,
    people,
    fit,
    strip: Array.from({ length: WEEK_COUNT }, (_, index) => {
      const start = addDays(FIRST_WEEK, index * 7)
      return {
        week_start: start,
        number: isoWeekNumber(start),
        status: statusFor(store, barId, start),
      }
    }),
    last_changed: store.changed.get(weekKey(barId, weekStart)) ?? null,
  }
}

function findPlace(store: Store, slotId: number) {
  for (const shift of store.shifts) {
    const place = shift.places.find(candidate => candidate.slot_id === slotId)
    if (place) return { shift, place }
  }
  throw new RefusedError("Plassen finnes ikke lenger. Oppdater siden.")
}

function findAssignment(store: Store, assignmentId: number) {
  for (const shift of store.shifts) {
    const place = shift.places.find(
      candidate => candidate.assignment?.assignment_id === assignmentId,
    )
    if (place?.assignment) return { shift, place, assignment: place.assignment }
  }
  throw new RefusedError("Plassen er endret. Oppdater siden.")
}

function person(store: Store, volunteerId: number): StoredPerson {
  const found = store.people.find(
    candidate => candidate.volunteer_id === volunteerId,
  )
  if (!found) throw new RefusedError("Fant ikke personen i gruppa.")
  return found
}

function requireFresh(store: Store, board: WeekBoard) {
  const current = String(
    store.version.get(weekKey(board.bar.id, board.week_start)) ?? 0,
  )
  if (current !== board.version)
    throw new RefusedError(
      "En annen leder har endret uka. Siden er oppdatert, prøv igjen.",
    )
}

function touch(store: Store, board: WeekBoard) {
  const key = weekKey(board.bar.id, board.week_start)
  store.version.set(key, (store.version.get(key) ?? 0) + 1)
  if (store.status.get(key) === "published") {
    store.status.set(key, "changed_after_publish")
    store.changed.set(key, { by: "Dev Admin", at: new Date().toISOString() })
  }
}

function checkFit(
  store: Store,
  shift: StoredShift,
  place: StoredPlace,
  who: StoredPerson,
  ignore?: number,
  confirmed = false,
) {
  const counts = dayCounts(store, mondayOf(shift.day))
  if (ignore !== undefined) {
    const key = `${ignore}|${shift.day}`
    counts.set(key, Math.max(0, (counts.get(key) ?? 0) - 1))
  }
  const saved = place.assignment
  place.assignment = null
  const fit = fitFor(store, shift, place, who, counts)
  place.assignment = saved
  if (!fit.ok)
    throw new RefusedError(`Ikke lagret: ${who.name}, ${fit.reason}.`)
  if (fit.needs_confirmation && !confirmed)
    throw new RefusedError(
      `Ikke lagret: ${who.name} mangler godkjenning for plassen og må bekreftes.`,
    )
  return fit.warnings
}

export function mondayOf(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`)
  return addDays(iso, -((date.getUTCDay() + 6) % 7))
}

function placeLabel(shift: StoredShift, place: StoredPlace): string {
  const kind = place.kind === "opplaering" ? "opplæring" : place.kind
  return `${kind}, ${shortDate(shift.day)}, ${shift.title.toLowerCase()}`
}

export function createFakeApi(
  store: Store = createStore(),
  delayMs = 120,
): LeaderApi {
  const wait = () => new Promise(resolve => setTimeout(resolve, delayMs))
  const result = (
    board: WeekBoard,
    message: string,
    warnings: Note[] = [],
  ): WriteResult => ({
    message,
    warnings,
    board: buildBoard(store, board.bar.id, board.week_start),
  })
  return {
    async me(): Promise<LeaderMe> {
      await wait()
      return {
        name: "Demo-leder",
        role: "Gruppeadmin",
        csrf_token: "fake",
        bars: BARS.map(bar => ({ id: bar.id, name: bar.name })),
      }
    },
    async week(groupId, weekStart) {
      await wait()
      return buildBoard(store, groupId, weekStart)
    },
    async place(board, slotId, volunteerId, confirmed) {
      await wait()
      requireFresh(store, board)
      const { shift, place } = findPlace(store, slotId)
      if (place.assignment && !place.assignment.cannot_attend)
        throw new RefusedError("Ikke lagret: plassen ble tatt i mellomtiden.")
      const who = person(store, volunteerId)
      const warnings = checkFit(store, shift, place, who, undefined, confirmed)
      place.assignment = newAssignment(store, volunteerId)
      touch(store, board)
      return result(
        board,
        `${who.name} er satt opp som ${placeLabel(shift, place)}.`,
        warnings,
      )
    },
    async replace(board, assignmentId, volunteerId, confirmed) {
      await wait()
      requireFresh(store, board)
      const { shift, place, assignment } = findAssignment(store, assignmentId)
      const before = person(store, assignment.volunteer_id)
      const who = person(store, volunteerId)
      const warnings = checkFit(
        store,
        shift,
        place,
        who,
        assignment.volunteer_id,
        confirmed,
      )
      place.assignment = newAssignment(store, volunteerId)
      touch(store, board)
      return result(
        board,
        `${who.name} tar plassen til ${before.name} (${placeLabel(shift, place)}).`,
        warnings,
      )
    },
    async move(board, assignmentId, toSlotId, confirmed) {
      await wait()
      requireFresh(store, board)
      const from = findAssignment(store, assignmentId)
      const to = findPlace(store, toSlotId)
      if (to.place.assignment && !to.place.assignment.cannot_attend)
        throw new RefusedError("Ikke lagret: plassen er ikke ledig.")
      const who = person(store, from.assignment.volunteer_id)
      const saved = from.place.assignment
      from.place.assignment = null
      try {
        const warnings = checkFit(
          store,
          to.shift,
          to.place,
          who,
          undefined,
          confirmed,
        )
        to.place.assignment = {
          ...newAssignment(store, who.volunteer_id),
          assignment_id: assignmentId,
        }
        touch(store, board)
        return result(
          board,
          `${who.name} er flyttet til ${placeLabel(to.shift, to.place)}.`,
          warnings,
        )
      } catch (error) {
        from.place.assignment = saved
        throw error
      }
    },
    async swap(board, a, b) {
      await wait()
      requireFresh(store, board)
      const first = findAssignment(store, a)
      const second = findAssignment(store, b)
      const firstPerson = person(store, first.assignment.volunteer_id)
      const secondPerson = person(store, second.assignment.volunteer_id)
      const savedFirst = first.place.assignment
      const savedSecond = second.place.assignment
      first.place.assignment = null
      second.place.assignment = null
      try {
        const warnings = [
          ...checkFit(store, second.shift, second.place, firstPerson),
          ...checkFit(store, first.shift, first.place, secondPerson),
        ]
        first.place.assignment = savedSecond
        second.place.assignment = savedFirst
        touch(store, board)
        return result(
          board,
          `${firstPerson.name} og ${secondPerson.name} har byttet plass.`,
          warnings,
        )
      } catch (error) {
        first.place.assignment = savedFirst
        second.place.assignment = savedSecond
        throw error
      }
    },
    async remove(board, assignmentId) {
      await wait()
      requireFresh(store, board)
      const { shift, place, assignment } = findAssignment(store, assignmentId)
      const who = person(store, assignment.volunteer_id)
      place.assignment = null
      touch(store, board)
      return result(
        board,
        `${who.name} er tatt av ${placeLabel(shift, place)}.`,
      )
    },
    async addPlace(board, shiftId, kind) {
      await wait()
      requireFresh(store, board)
      const shift = store.shifts.find(item => item.shift_id === shiftId)
      if (!shift) throw new RefusedError("Skiftet finnes ikke lenger.")
      if (kind === "skiftleder")
        throw new RefusedError(
          "Et skift har én skiftleder. Den legges ikke til eller fjernes her.",
        )
      if (kind === "opplaering")
        throw new RefusedError(
          "Opplæring er ikke en egen type plass. Legg til en skjenker i stedet.",
        )
      if (shift.places.filter(item => item.kind === kind).length >= 20)
        throw new RefusedError(
          "Det kan ikke være flere enn 20 plasser av samme type.",
        )
      // Same order as the server: after the last place of the same kind.
      const last = shift.places.findLastIndex(item => item.kind === kind)
      const highest = Math.max(
        ...store.shifts.flatMap(item => item.places.map(p => p.slot_id)),
      )
      const added = { slot_id: highest + 1, kind, assignment: null }
      if (last === -1) shift.places.push(added)
      else shift.places.splice(last + 1, 0, added)
      touch(store, board)
      return result(board, `Ny plass som ${placeLabel(shift, added)}.`)
    },
    async removePlace(board, slotId) {
      await wait()
      requireFresh(store, board)
      const { shift, place } = findPlace(store, slotId)
      if (place.kind === "skiftleder")
        throw new RefusedError(
          "Et skift har én skiftleder. Den legges ikke til eller fjernes her.",
        )
      if (place.assignment)
        throw new RefusedError(
          "Alle plassene av denne typen er i bruk. Ta personen av først.",
        )
      shift.places = shift.places.filter(item => item !== place)
      touch(store, board)
      return result(board, `Plassen er fjernet, ${placeLabel(shift, place)}.`)
    },
    async setStatus(board, status) {
      await wait()
      requireFresh(store, board)
      store.status.set(weekKey(board.bar.id, board.week_start), status)
      store.changed.delete(weekKey(board.bar.id, board.week_start))
      const key = weekKey(board.bar.id, board.week_start)
      store.version.set(key, (store.version.get(key) ?? 0) + 1)
      return result(
        board,
        status === "published"
          ? `Uke ${board.week_number} er publisert. Folk ser skiftene sine i appen nå.`
          : `Uke ${board.week_number} er åpen for ønsker igjen.`,
      )
    },
  }
}

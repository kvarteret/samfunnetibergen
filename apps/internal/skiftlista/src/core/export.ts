// The week as a flat table for Excel and Google Sheets: one row per place, so
// it pastes straight into the backup sheet ("Arkiv"). No Svelte, no browser
// APIs: the page only turns the text into a download.

import type { WeekBoard } from "./types"
import { DAY_NAMES, KIND_LABEL, STATUS_TEXT } from "./view"

export const CSV_HEADER = [
  "Dato",
  "Ukedag",
  "Uke",
  "Bar",
  "Skift",
  "Tid",
  "Rolle",
  "Person",
  "Merknad",
  "Ukestatus",
] as const

/** Norwegian Excel reads ";" as the column separator, and "," as the decimal mark. */
const SEPARATOR = ";"
/** Excel only shows æ, ø and å right in a UTF-8 file that starts with this mark. */
const BOM = "﻿"

/** "2026-12-01" -> "01.12.2026", which Norwegian Excel and Sheets read as a date. */
function norwegianDate(iso: string): string {
  const [year, month, day] = iso.split("-")
  return `${day}.${month}.${year}`
}

function weekdayName(iso: string): string {
  return DAY_NAMES[(new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7]
}

/**
 * Text that starts with = + - @ is read as a formula by Excel and Sheets. A
 * name or note must never run as one, so it gets a leading apostrophe.
 */
function safe(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

function quote(cell: string): string {
  return /[;"\r\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell
}

/** One row per place, in the order of the grid: day, then shift, then place. */
export function weekToRows(board: WeekBoard): string[][] {
  const shifts = [...board.shifts].sort(
    (a, b) => a.day.localeCompare(b.day) || a.position - b.position,
  )
  const rows: string[][] = []
  for (const shift of shifts) {
    for (const place of shift.places) {
      const assignment = place.assignment
      const person = assignment
        ? (board.people.find(p => p.volunteer_id === assignment.volunteer_id)
            ?.name ?? "(ukjent)")
        : ""
      const notes: string[] = []
      if (assignment?.training) notes.push(`Opplæring ${assignment.training}`)
      if (assignment?.cannot_attend) notes.push("Kan ikke i dag")
      if (assignment?.swap_requested) notes.push("Ønsker bytte")
      if (shift.closed) notes.push("Stengt")
      rows.push([
        norwegianDate(shift.day),
        weekdayName(shift.day),
        String(board.week_number),
        board.bar.name,
        shift.title,
        shift.time_label,
        KIND_LABEL[place.kind],
        person,
        notes.join(", "),
        STATUS_TEXT[board.status],
      ])
    }
  }
  return rows
}

/** The whole file: BOM, header, rows, with ";" between cells and CRLF between lines. */
export function weekToCsv(board: WeekBoard): string {
  const lines = [[...CSV_HEADER], ...weekToRows(board)].map(row =>
    row.map(cell => quote(safe(cell))).join(SEPARATOR),
  )
  return `${BOM}${lines.join("\r\n")}\r\n`
}

/** "skiftliste-stjerne-uke-49.csv": plain letters only, safe on every system. */
export function csvFileName(board: WeekBoard): string {
  const bar = board.bar.name
    .toLowerCase()
    .replaceAll("æ", "ae")
    .replaceAll("ø", "o")
    .replaceAll("å", "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `skiftliste-${bar || "bar"}-uke-${board.week_number}.csv`
}

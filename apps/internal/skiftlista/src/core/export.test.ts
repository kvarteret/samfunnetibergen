import { describe, expect, it } from "vitest"
import { csvFileName, weekToCsv, weekToRows } from "./export"
import { buildBoard, createStore, FIRST_WEEK } from "./fake"
import type { WeekBoard } from "./types"
import { allPlaces, KIND_LABEL } from "./view"

// Invented data only (src/core/fake.ts), never real names.
const board = buildBoard(createStore(), 11, FIRST_WEEK)

function withPerson(name: string): WeekBoard {
  const copy = structuredClone(board)
  const place = allPlaces(copy).find(ref => ref.place.assignment)
  if (!place?.place.assignment)
    throw new Error("the fake week has no placed person")
  const person = copy.people.find(
    p => p.volunteer_id === place.place.assignment?.volunteer_id,
  )
  if (!person) throw new Error("the placed person is missing from the pool")
  person.name = name
  return copy
}

describe("week to rows", () => {
  const rows = weekToRows(board)

  it("has one row per place, with ten cells each", () => {
    expect(rows).toHaveLength(allPlaces(board).length)
    for (const row of rows) expect(row).toHaveLength(10)
  })

  it("writes dates the way Norwegian Excel reads them, and the weekday in words", () => {
    const first = rows[0]
    expect(first[0]).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
    expect(first[1]).toBe("Mandag")
    expect(first[2]).toBe(String(board.week_number))
    expect(first[3]).toBe(board.bar.name)
  })

  it("lists days in order and the role in words", () => {
    const days = rows.map(row => row[0].split(".").reverse().join("-"))
    expect([...days].sort()).toEqual(days)
    const roles = new Set(Object.values(KIND_LABEL))
    for (const row of rows) expect(roles.has(row[6])).toBe(true)
  })

  it("leaves Person empty on an open place and names the person on a placed one", () => {
    const placedNames = rows.filter(row => row[7] !== "")
    const empty = rows.filter(row => row[7] === "")
    expect(placedNames.length).toBeGreaterThan(0)
    expect(empty.length).toBeGreaterThan(0)
    for (const row of placedNames) {
      expect(board.people.some(person => person.name === row[7])).toBe(true)
    }
  })
})

describe("csv text", () => {
  const csv = weekToCsv(board)

  it("starts with the byte order mark so æ ø å show in Excel", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it("uses semicolons and Windows line breaks", () => {
    const lines = csv.slice(1).split("\r\n")
    expect(lines.at(-1)).toBe("")
    expect(lines[0]).toBe(
      "Dato;Ukedag;Uke;Bar;Skift;Tid;Rolle;Person;Merknad;Ukestatus",
    )
    expect(lines.length - 2).toBe(weekToRows(board).length)
  })

  it("quotes a cell that holds a semicolon, a quote or a line break", () => {
    const text = weekToCsv(withPerson('Ada; "A" \nB.'))
    expect(text).toContain('"Ada; ""A"" \nB."')
  })

  it("stops a name from running as a spreadsheet formula", () => {
    const text = weekToCsv(withPerson("=HYPERLINK(1)"))
    expect(text).toContain("'=HYPERLINK(1)")
    expect(text).not.toContain(";=HYPERLINK")
  })

  it("marks a closed shift and a week that is not published", () => {
    const copy = structuredClone(board)
    copy.shifts[0].closed = true
    copy.status = "changed_after_publish"
    const closed = copy.shifts[0]
    const [year, month, day] = closed.day.split("-")
    const rows = weekToRows(copy)
    // Several days share a title and a time, so the date picks out this shift.
    const rowsOfClosed = rows.filter(
      row =>
        row[0] === `${day}.${month}.${year}` &&
        row[4] === closed.title &&
        row[5] === closed.time_label,
    )
    expect(rowsOfClosed).toHaveLength(closed.places.length)
    expect(rowsOfClosed.every(row => row[8].includes("Stengt"))).toBe(true)
    // Another shift in the same week is not marked.
    expect(rows.some(row => !row[8].includes("Stengt"))).toBe(true)
    expect(rows.every(row => row[9] === "Endret etter publisering")).toBe(true)
  })
})

describe("file name", () => {
  it("is plain letters, with æ ø å spelled out", () => {
    const copy = structuredClone(board)
    copy.bar.name = "Grøndahls Å/Æ"
    copy.week_number = 49
    expect(csvFileName(copy)).toBe("skiftliste-grondahls-a-ae-uke-49.csv")
  })
})

import { readFileSync } from "node:fs"
import AxeBuilder from "@axe-core/playwright"
import { expect, type Page, test } from "@playwright/test"

// The page in "live" mode (?api=http): it reads from Personal through
// /personal/*. These tests answer those requests with a recorded real response
// (demo data from a local Personal, bar Stjerne, week 45), so they need no
// Personal. Writes are answered the same way and recorded, so the tests can check what the
// page sent (method, token, version, real slot id, confirmed).

const fixture = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"),
  )
const ME = fixture("me.json")
const WEEK = fixture("week-stjerne-45.json")

const places = (page: Page) => page.locator("[data-slot]")

interface Write {
  method: string
  path: string
  headers: Record<string, string>
  body: Record<string, unknown> | null
}

/**
 * Answers Personal's leader API. Reads get the recorded week (for the week in
 * the address); every write is recorded in `writes` and answered by
 * `onWrite` (default: 200 with the recorded week).
 */
async function mockPersonal(
  page: Page,
  onWrite?: (write: Write) => { status: number; json: unknown },
) {
  const asked: string[] = []
  const writes: Write[] = []
  await page.route("**/personal/api/v1/leader/shifts/**", async route => {
    const request = route.request()
    const url = new URL(request.url())
    asked.push(url.pathname + url.search)
    if (url.pathname.endsWith("/me")) return route.fulfill({ json: ME })
    if (request.method() === "GET") {
      // The week asked for in the address, so the page and the address agree.
      const weekStart = url.pathname.split("/").pop()
      return route.fulfill({ json: { ...WEEK, week_start: weekStart } })
    }
    const write: Write = {
      method: request.method(),
      path:
        url.pathname.replace("/personal/api/v1/leader/shifts", "") + url.search,
      headers: request.headers(),
      body: request.postDataJSON(),
    }
    writes.push(write)
    const answer = onWrite?.(write) ?? {
      status: 200,
      json: { message: "Gjort.", warnings: [], board: WEEK },
    }
    return route.fulfill({ status: answer.status, json: answer.json })
  })
  return Object.assign(asked, { writes })
}

interface FixturePlace {
  slot_id: number
  seat: number
  kind: string
  assignment: unknown
}

/** An empty skjenker box and a person who fits it without a popup. */
function easyPlacing() {
  for (const shift of WEEK.shifts) {
    for (const place of shift.places as FixturePlace[]) {
      if (place.assignment || place.kind !== "skjenker") continue
      for (const person of WEEK.people) {
        const fit = WEEK.fit[person.volunteer_id]?.[place.slot_id]
        if (fit?.ok && !fit.needs_confirmation)
          return { person, place, boxId: place.slot_id * 100 + place.seat }
      }
    }
  }
  throw new Error("fixture has no easy placing")
}

/** An empty skiftleder box and a person who needs the popup for it. */
function popupPlacing() {
  for (const shift of WEEK.shifts) {
    for (const place of shift.places as FixturePlace[]) {
      if (place.assignment || place.kind !== "skiftleder") continue
      for (const person of WEEK.people) {
        const fit = WEEK.fit[person.volunteer_id]?.[place.slot_id]
        if (fit?.ok && fit.needs_confirmation)
          return { person, place, boxId: place.slot_id * 100 + place.seat }
      }
    }
  }
  throw new Error("fixture has no popup placing")
}

const personButton = (page: Page, name: string) =>
  page
    .getByRole("list", { name: "Personer" })
    .getByRole("button")
    .filter({ hasText: name })
    .first()

test("opens the week named in the address and keeps bar and week in it", async ({
  page,
}) => {
  const asked = await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")

  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  await expect(
    page
      .getByRole("navigation", { name: "Barer" })
      .getByRole("button", { name: "Stjerne" }),
  ).toHaveAttribute("aria-current", "page")
  await expect(page.getByText("lagrer i Personal")).toBeVisible()
  expect(asked).toContain(
    "/personal/api/v1/leader/shifts/weeks/2026-11-02?group_id=7",
  )
  await expect(page).toHaveURL(/api=http/)
  await expect(page).toHaveURL(/bar=7/)
  await expect(page).toHaveURL(/uke=2026-11-02/)
})

test("next week asks Personal for the next Monday and updates the address", async ({
  page,
}) => {
  const asked = await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  await page.getByRole("button", { name: "Neste uke" }).click()

  await expect
    .poll(() => asked.some(url => url.includes("2026-11-09")))
    .toBe(true)
  await expect(page).toHaveURL(/uke=2026-11-09/)
})

test("every box has its own id, also when a slot has several seats", async ({
  page,
}) => {
  await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()

  const ids = await places(page).evaluateAll(nodes =>
    nodes.map(node => node.getAttribute("data-slot")),
  )
  const expected = WEEK.shifts.flatMap(
    (shift: { places: unknown[] }) => shift.places,
  ).length
  expect(ids.length).toBe(expected)
  expect(new Set(ids).size).toBe(ids.length)
})

test("ledige counts only the places that must be filled", async ({ page }) => {
  await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  const needed = WEEK.shifts
    .flatMap((shift: { places: { needed: boolean }[] }) => shift.places)
    .filter((place: { needed: boolean }) => place.needed).length
  // The empty Opplæring places are drawn, but they are not counted.
  expect(needed).toBe(5)
  await expect(
    page.getByRole("button", { name: `${needed} ledige` }),
  ).toBeVisible()
  await expect(
    places(page).filter({ hasText: "Ledig" }).filter({ hasText: "Opplæring" }),
  ).not.toHaveCount(0)
})

test("planned hours come from Personal", async ({ page }) => {
  await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  const withHours = WEEK.people.find(
    (person: { week_minutes: number }) => person.week_minutes > 0,
  )
  const hours = Math.floor(withHours.week_minutes / 60)
  await expect(
    page
      .getByRole("list", { name: "Personer" })
      .getByRole("button")
      .filter({ hasText: withHours.name }),
  ).toContainText(`${hours} t`)
})

test("someone without approval can be offered with the red warning and the popup", async ({
  page,
}) => {
  await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  const nonLeader = WEEK.people.find(
    (person: { is_skiftleder: boolean }) => !person.is_skiftleder,
  )
  await page
    .getByRole("list", { name: "Personer" })
    .getByRole("button")
    .filter({ hasText: nonLeader.name })
    .first()
    .click()
  const offer = places(page)
    .filter({ hasText: "Kun for godkjente skiftledere" })
    .first()
  await expect(offer).toContainText("Krever bekreftelse")
  await offer.click()
  await expect(page.getByRole("alertdialog")).toContainText(
    "Kun for godkjente skiftledere",
  )
})

test("placing a person sends token, version and the real slot id", async ({
  page,
}) => {
  const asked = await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  const { person, place, boxId } = easyPlacing()

  await personButton(page, person.name).click()
  await page.locator(`[data-slot="${boxId}"]`).click()

  await expect(
    page.getByRole("status").filter({ hasText: "Gjort." }),
  ).toBeVisible()
  expect(asked.writes).toHaveLength(1)
  const write = asked.writes[0]
  expect(write.method).toBe("POST")
  expect(write.path).toBe("/placements?group_id=7&week_start=2026-11-02")
  expect(write.headers["x-csrf-token"]).toBe("fixture")
  expect(write.headers["if-match"]).toBe(WEEK.version)
  expect(write.body).toEqual({
    slot_id: place.slot_id,
    volunteer_id: person.volunteer_id,
    confirmed: false,
  })
})

test("the popup's Sett inn likevel sends confirmed", async ({ page }) => {
  const asked = await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  const { person, place, boxId } = popupPlacing()

  await personButton(page, person.name).click()
  await page.locator(`[data-slot="${boxId}"]`).click()
  // Nothing is sent before the leader answers the popup.
  expect(asked.writes).toHaveLength(0)
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Sett inn likevel" })
    .click()

  await expect.poll(() => asked.writes.length).toBe(1)
  expect(asked.writes[0].body).toEqual({
    slot_id: place.slot_id,
    volunteer_id: person.volunteer_id,
    confirmed: true,
  })
})

test("Avbryt in the popup sends nothing", async ({ page }) => {
  const asked = await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  const { person, boxId } = popupPlacing()

  await personButton(page, person.name).click()
  await page.locator(`[data-slot="${boxId}"]`).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Avbryt" })
    .click()

  await expect(page.getByRole("alertdialog")).toHaveCount(0)
  expect(asked.writes).toHaveLength(0)
})

test("a refusal shows Personal's text and the week is read again", async ({
  page,
}) => {
  const stale = "En annen leder har endret uka. Siden er oppdatert, prøv igjen."
  const asked = await mockPersonal(page, () => ({
    status: 409,
    json: { detail: stale },
  }))
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  const weekReads = () => asked.filter(url => url.includes("/weeks/")).length
  const before = weekReads()
  const { person, boxId } = easyPlacing()

  await personButton(page, person.name).click()
  await page.locator(`[data-slot="${boxId}"]`).click()

  await expect(
    page.getByRole("status").filter({ hasText: stale }),
  ).toBeVisible()
  await expect.poll(weekReads).toBeGreaterThan(before)
})

test("making the week a draft sends PUT status for the bar", async ({
  page,
}) => {
  const asked = await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  // The recorded week is published, so the button offers a draft.
  await page.getByRole("button", { name: "Gjør til utkast" }).click()
  // Hiding the week from volunteers asks first; Avbryt sends nothing.
  const dialog = page.getByRole("alertdialog", {
    name: "Gjøre uka til utkast?",
  })
  await expect(dialog).toContainText("Frivillige ser ikke skiftene sine")
  await dialog.getByRole("button", { name: "Avbryt" }).click()
  await expect(dialog).toBeHidden()
  expect(asked.writes).toHaveLength(0)
  await page.getByRole("button", { name: "Gjør til utkast" }).click()
  await dialog.getByRole("button", { name: "Gjør til utkast" }).click()

  await expect.poll(() => asked.writes.length).toBe(1)
  expect(asked.writes[0].method).toBe("PUT")
  expect(asked.writes[0].path).toBe("/weeks/2026-11-02/status?group_id=7")
  expect(asked.writes[0].body).toEqual({ status: "open" })
})

test("not signed in: a clear message with a link to Personal's login", async ({
  page,
}) => {
  await page.route("**/personal/api/v1/leader/shifts/**", route =>
    route.fulfill({
      status: 401,
      json: { detail: "Authentication required." },
    }),
  )
  await page.goto("/?api=http")

  const alert = page.getByRole("alert")
  await expect(alert).toContainText("Du er ikke logget inn i Personal.")
  await expect(
    alert.getByRole("link", { name: "Logg inn i Personal" }),
  ).toHaveAttribute("href", "/login")
})

test("a failing server shows Personal's own text and Prøv igjen works", async ({
  page,
}) => {
  let failing = true
  await page.route("**/personal/api/v1/leader/shifts/**", route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith("/me")) return route.fulfill({ json: ME })
    if (failing)
      return route.fulfill({
        status: 503,
        json: { detail: "Skiftplanen er ikke satt opp ennå." },
      })
    return route.fulfill({ json: WEEK })
  })
  await page.goto("/?api=http&bar=7&uke=2026-11-02")

  await expect(page.getByRole("alert")).toContainText(
    "Skiftplanen er ikke satt opp ennå.",
  )
  failing = false
  await page.getByRole("button", { name: "Prøv igjen" }).click()
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
})

test("no automatic accessibility violations on a real board", async ({
  page,
}) => {
  await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(results.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

// ---- plus and minus ------------------------------------------------------------------------------

/** The shift of the easy placing, and the last empty skjenker box on it (what "-" takes away). */
function shiftWithEmptySkjenker() {
  const { place } = easyPlacing()
  const shift = WEEK.shifts.find((item: { places: FixturePlace[] }) =>
    item.places.some(p => p.slot_id === place.slot_id),
  )
  const empty = (shift.places as FixturePlace[]).filter(
    p => p.kind === "skjenker" && !p.assignment,
  )
  return { shift, last: empty[empty.length - 1] }
}

test("plus sends POST on the shift with the kind, token and version", async ({
  page,
}) => {
  const asked = await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  const { shift } = shiftWithEmptySkjenker()

  await page.locator(`[data-plus="${shift.shift_id}-skjenker"]`).click()

  await expect(
    page.getByRole("status").filter({ hasText: "Gjort." }),
  ).toBeVisible()
  expect(asked.writes).toHaveLength(1)
  const write = asked.writes[0]
  expect(write.method).toBe("POST")
  expect(write.path).toBe(
    `/shifts/${shift.shift_id}/places?group_id=7&week_start=2026-11-02`,
  )
  expect(write.headers["x-csrf-token"]).toBe("fixture")
  expect(write.headers["if-match"]).toBe(WEEK.version)
  expect(write.body).toEqual({ kind: "skjenker" })
})

test("minus sends DELETE on the real slot of the last empty place", async ({
  page,
}) => {
  const asked = await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  const { shift, last } = shiftWithEmptySkjenker()

  await page.locator(`[data-minus="${shift.shift_id}-skjenker"]`).click()

  await expect(
    page.getByRole("status").filter({ hasText: "Gjort." }),
  ).toBeVisible()
  expect(asked.writes).toHaveLength(1)
  expect(asked.writes[0].method).toBe("DELETE")
  expect(asked.writes[0].path).toBe(
    `/slots/${last.slot_id}/seat?group_id=7&week_start=2026-11-02`,
  )
  expect(asked.writes[0].headers["if-match"]).toBe(WEEK.version)
})

test("a refusal of minus shows Personal's text", async ({ page }) => {
  await mockPersonal(page, () => ({
    status: 409,
    json: {
      detail: "Alle plassene av denne typen er i bruk. Ta personen av først.",
    },
  }))
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  const { shift } = shiftWithEmptySkjenker()
  await page.locator(`[data-minus="${shift.shift_id}-skjenker"]`).click()
  await expect(
    page.getByRole("alert").or(page.getByRole("status")),
  ).toContainText("er i bruk")
})

test("a write that cannot reach Personal says it was not saved", async ({
  page,
}) => {
  const asked = await mockPersonal(page)
  await page.goto("/?api=http&bar=7&uke=2026-11-02")
  await expect(page.getByRole("heading", { name: "Uke 45" })).toBeVisible()
  // The connection drops for writes only; reading still works.
  await page.route("**/weeks/*/status*", route =>
    route.abort("connectionfailed"),
  )
  await page.getByRole("button", { name: "Gjør til utkast" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Gjør til utkast" })
    .click()
  await expect(page.getByRole("status")).toContainText(
    "Ikke lagret: fikk ikke kontakt med Personal",
  )
  // The week is still on screen and still published.
  await expect(page.getByText("Publisert", { exact: true })).toBeVisible()
  expect(asked.writes).toHaveLength(0)
})

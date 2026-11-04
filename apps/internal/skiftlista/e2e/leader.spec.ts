import AxeBuilder from "@axe-core/playwright"
import { expect, type Locator, type Page, test } from "@playwright/test"

// The fake server's first week (Stjerne, uke 49) is seeded the same way on
// every load: Monday to Wednesday half planned, Kari B. on a Wednesday place
// she answered "kan ikke" for, Sara H. "kan ikke i dag" on Monday.

const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: /\S/ }).first()
const people = (page: Page) => page.getByRole("list", { name: "Personer" })
const person = (page: Page, name: string) =>
  people(page).getByRole("button").filter({ hasText: name })
const places = (page: Page) => page.locator("[data-slot]")
/** An offer "Sett inn <name>" that places at once: the person did not answer kan ikke there. */
const easyOffer = (page: Page, name: string) =>
  places(page)
    .filter({ hasText: `Sett inn ${name}` })
    .filter({ hasNotText: "bekreftelse" })
    .first()
const place = (page: Page, label: RegExp) =>
  page.locator("[data-slot]").and(page.getByRole("button", { name: label }))

async function slotOf(locator: Locator): Promise<string> {
  const slot = await locator.getAttribute("data-slot")
  if (!slot) throw new Error("place has no data-slot")
  return slot
}

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Uke 49" })).toBeVisible()
})

test("shows the week, the bar tabs and the chips", async ({ page }) => {
  await expect(
    page
      .getByRole("navigation", { name: "Barer" })
      .getByRole("button", { name: "Stjerne" }),
  ).toHaveAttribute("aria-current", "page")
  await expect(page.getByRole("button", { name: "! 1 problem" })).toBeVisible()
  await expect(page.getByText("Har svart")).toContainText("13")
  await expect(page.getByRole("table")).toBeVisible()
})

test("person first: select, place, focus returns, Ctrl+Z undoes", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Uten skift", exact: true }).click()
  const emil = person(page, "Emil T.")
  await emil.click()
  await expect(emil).toHaveAttribute("aria-pressed", "true")

  const offer = easyOffer(page, "Emil")
  const slot = await slotOf(offer)
  await offer.click()
  await expect(status(page)).toContainText("Emil T. er satt opp som")
  await expect(page.locator(`[data-slot="${slot}"]`)).toBeFocused()

  await page.keyboard.press("Control+z")
  await expect(status(page)).toContainText("Emil T. er tatt av")
  await expect(page.locator(`[data-slot="${slot}"]`)).toContainText(
    "Sett inn Emil",
  )
})

test("person first: a place the person lacks the approval for says so in red and asks to confirm", async ({
  page,
}) => {
  await person(page, "Emil T.").click()
  const offer = places(page)
    .filter({ hasText: "bare godkjente skiftledere" })
    .first()
  await expect(offer).toBeVisible()
  await expect(offer).toContainText("Sett inn Emil")
  await expect(offer).toContainText("Krever bekreftelse")
})

test("place first: the panel lists qualified people first and the rest behind a confirmation", async ({
  page,
}) => {
  const slPlace = place(page, /^Skiftleder torsdag 3\. desember, Dagskift/)
  await slPlace.click()
  const heading = page.getByRole("heading", {
    name: "Skiftleder, torsdag 3. desember",
  })
  await expect(heading).toBeFocused()
  const panel = page.locator("#place-panel")
  // Everyone in the answer groups (before "Uten godkjenning") is a skiftleder.
  const qualified = panel.locator("div:has(> h3)").filter({
    hasNot: page.getByRole("heading", { name: /^Uten godkjenning/ }),
  })
  const names = qualified.getByRole("listitem").getByRole("button")
  const count = await names.count()
  expect(count).toBeGreaterThan(0)
  for (let index = 0; index < count; index++) {
    await expect(names.nth(index)).toContainText("· SL")
  }
  await expect(
    panel.getByRole("heading", {
      name: /^Uten godkjenning, krever bekreftelse/,
    }),
  ).toBeVisible()
  await names.first().click()
  await expect(status(page)).toContainText("er satt opp som skiftleder")
  await expect(panel).toHaveCount(0)
})

test("placing someone without approval: a popup with the red warning, Avbryt does nothing", async ({
  page,
}) => {
  const slPlace = place(page, /^Skiftleder torsdag 3\. desember, Dagskift/)
  const slot = await slotOf(slPlace)
  await person(page, "Emil T.").click()
  await slPlace.click()
  const dialog = page.getByRole("alertdialog", {
    name: "Sette inn Emil likevel?",
  })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText("bare godkjente skiftledere")
  // Focus starts on the safe choice.
  await expect(dialog.getByRole("button", { name: "Avbryt" })).toBeFocused()
  await dialog.getByRole("button", { name: "Avbryt" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator(`[data-slot="${slot}"]`)).toBeFocused()
  // Nothing was placed: the place still offers Emil, it does not show him.
  await expect(page.locator(`[data-slot="${slot}"]`)).toContainText(
    "Sett inn Emil",
  )
  await expect(status(page)).toHaveCount(0)
})

test("placing someone without approval: Sett inn likevel places them, Ctrl+Z takes them off again", async ({
  page,
}) => {
  const slPlace = place(page, /^Skiftleder torsdag 3\. desember, Dagskift/)
  const slot = await slotOf(slPlace)
  await person(page, "Emil T.").click()
  await slPlace.click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Sett inn likevel" })
    .click()
  await expect(status(page)).toContainText("Emil T. er satt opp som skiftleder")
  await expect(page.locator(`[data-slot="${slot}"]`)).toContainText("Emil T.")
  await expect(page.locator(`[data-slot="${slot}"]`)).toBeFocused()
  await page.keyboard.press("Control+z")
  await expect(status(page)).toContainText("Emil T. er tatt av")
})

test("Escape closes the popup like Avbryt", async ({ page }) => {
  await person(page, "Emil T.").click()
  await place(page, /^Skiftleder torsdag 3\. desember, Dagskift/).click()
  await expect(page.getByRole("alertdialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("alertdialog")).toHaveCount(0)
})

test("the popup has no automatic accessibility violations", async ({
  page,
}) => {
  await person(page, "Emil T.").click()
  await place(page, /^Skiftleder torsdag 3\. desember, Dagskift/).click()
  await expect(page.getByRole("alertdialog")).toBeVisible()
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(results.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test("people show planned hours for the week", async ({ page }) => {
  // People without a shift show no hours; those with one do.
  await expect(
    people(page).getByRole("button").filter({ hasText: /\d+ t/ }).first(),
  ).toBeVisible()
})

test("Escape closes the panel and returns focus to the place", async ({
  page,
}) => {
  const target = place(page, /^Skjenker torsdag 3\. desember, Dagskift/)
  const slot = await slotOf(target)
  await target.click()
  await expect(page.locator("#place-panel")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.locator("#place-panel")).toHaveCount(0)
  await expect(page.locator(`[data-slot="${slot}"]`)).toBeFocused()
})

test("move to an empty place, then undo", async ({ page }) => {
  const from = place(
    page,
    /^Skjenker tirsdag 1\. desember, Dagskift. Ingrid V\./,
  )
  const fromSlot = await slotOf(from)
  await from.click()
  await page.getByRole("button", { name: "Flytt eller bytt" }).click()
  await expect(page.getByText("Velg en ledig plass å flytte til")).toBeVisible()
  const to = places(page).filter({ hasText: "Flytt hit" }).first()
  await to.click()
  await expect(status(page)).toContainText("Ingrid V. er flyttet til")
  await page.keyboard.press("Control+z")
  await expect(page.locator(`[data-slot="${fromSlot}"]`)).toContainText(
    "Ingrid V.",
  )
})

test("swap two placed skiftledere", async ({ page }) => {
  const a = place(page, /^Skiftleder mandag 30\. november, Dagskift. Even M\./)
  await a.click()
  await page.getByRole("button", { name: "Flytt eller bytt" }).click()
  await place(page, /^Skiftleder tirsdag 1\. desember, Dagskift/).click()
  await expect(status(page)).toContainText("har byttet plass")
  await expect(
    place(page, /^Skiftleder tirsdag 1\. desember, Dagskift. Even M\./),
  ).toBeVisible()
})

test("remove a person from the panel", async ({ page }) => {
  await place(page, /^Skjenker onsdag 2\. desember, Dagskift. Kari B\./).click()
  await page.getByRole("button", { name: "Fjern Kari B." }).click()
  await expect(status(page)).toContainText("Kari B. er tatt av")
  await expect(page.getByRole("button", { name: "! 1 problem" })).toHaveCount(0)
})

test("drag a person onto an empty place", async ({ page }) => {
  await page.getByRole("button", { name: "Uten skift", exact: true }).click()
  const target = place(
    page,
    /^Skjenker torsdag 3\. desember, Kveldsskift/,
  ).first()
  await person(page, "Emil T.").dragTo(target)
  await expect(status(page)).toContainText("Emil T. er satt opp som")
})

test("publish, then a change marks the week as changed", async ({ page }) => {
  await page.getByRole("button", { name: "Publiser uka" }).click()
  await expect(page.getByText("Publisert", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Gjør til utkast" }),
  ).toBeVisible()
  await person(page, "Emil T.").click()
  await easyOffer(page, "Emil").click()
  await expect(
    page.getByText("Endret etter publisering", { exact: true }),
  ).toBeVisible()
})

test("search and filters narrow the people list", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Søk etter navn" }).fill("ada")
  await expect(people(page).getByRole("button")).toHaveCount(1)
  await page.getByRole("searchbox", { name: "Søk etter navn" }).fill("")
  await page.getByRole("button", { name: "Skiftledere" }).click()
  await expect(people(page).getByRole("button")).toHaveCount(5)
  await expect(page.getByText("Viser 5 av 16")).toBeVisible()
})

test("a day header sorts people by that day's answers", async ({ page }) => {
  const monday = page.getByRole("button", { name: /^Mandag 30\. november/ })
  await monday.click()
  await expect(monday).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByText("Sortert etter svar for")).toContainText(
    "mandag 30. november",
  )
  await page.getByRole("button", { name: "Fjern dag" }).click()
  await expect(monday).toHaveAttribute("aria-pressed", "false")
})

test("switch bar and week", async ({ page }) => {
  await page
    .getByRole("navigation", { name: "Barer" })
    .getByRole("button", { name: "Grøndahls" })
    .click()
  await expect(page.getByRole("rowheader", { name: /Pub/ })).toBeVisible()
  await expect(
    place(page, /^Skiftleder lørdag 5\. desember, Pub/),
  ).toBeVisible()
  await page.getByRole("button", { name: "Neste uke" }).click()
  await expect(page.getByRole("heading", { name: "Uke 50" })).toBeVisible()
  await page.getByRole("button", { name: /^Uke 49,/ }).click()
  await expect(page.getByRole("heading", { name: "Uke 49" })).toBeVisible()
})

test("keyboard only: select with Enter and place with Enter", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Uten skift", exact: true }).focus()
  await page.keyboard.press("Enter")
  await person(page, "Emil T.").focus()
  await page.keyboard.press("Enter")
  const offer = easyOffer(page, "Emil")
  await offer.focus()
  await page.keyboard.press("Enter")
  await expect(status(page)).toContainText("Emil T. er satt opp som")
})

test("no automatic accessibility violations (axe, WCAG 2.1 AA)", async ({
  page,
}) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(results.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test("axe also passes with a place panel open (small text, all four groups)", async ({
  page,
}) => {
  await place(page, /^Skjenker torsdag 3\. desember, Dagskift/).click()
  await expect(page.locator("#place-panel")).toBeVisible()
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(results.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test("narrow screen: the page itself never scrolls sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 })
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test("someone who cannot come today: the place shows who and needs a replacement", async ({
  page,
}) => {
  const sickPlace = place(
    page,
    /^Skjenker mandag 30\. november, Dagskift. Sara H\./,
  )
  await expect(sickPlace).toContainText("Kan ikke i dag, trenger erstatter")
  await sickPlace.click()
  await expect(page.locator("#place-panel")).toContainText(
    "Sara H. har meldt kan ikke i dag",
  )
  await page
    .locator("#place-panel")
    .getByRole("listitem")
    .getByRole("button")
    .first()
    .click()
  await expect(status(page)).toContainText("er satt opp som skjenker")
  await expect(
    page.locator(`[data-slot]`).filter({ hasText: "trenger erstatter" }),
  ).toHaveCount(0)
})

test("print: the whole week fits on a landscape page", async ({ page }) => {
  // A4 landscape minus 10 mm margins is about 277 mm, or 1047 CSS pixels.
  await page.setViewportSize({ width: 1047, height: 740 })
  await page.emulateMedia({ media: "print" })
  const sunday = page.getByRole("columnheader", { name: /Søndag/ })
  const box = await sunday.boundingBox()
  expect(box).not.toBeNull()
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(1047)
  await expect(page.locator("#people-panel")).toBeHidden()
  await expect(page.getByRole("button", { name: "Publiser uka" })).toBeHidden()
})

test("an unpublished week says so, and the banner follows the status", async ({
  page,
}) => {
  const banner = page.getByRole("region", { name: "Publisering" })
  await expect(banner).toContainText("Uka er ikke publisert.")
  await expect(banner).toContainText(
    "Frivillige ser ikke skiftene sine før du trykker",
  )

  await page.getByRole("button", { name: "Publiser uka" }).click()
  await expect(banner).toBeHidden()

  // A change after publishing brings it back with other words.
  await person(page, "Emil T.").click()
  await easyOffer(page, "Emil").click()
  await expect(banner).toContainText("Uka er endret etter publisering.")
  await expect(banner).toContainText("Trykk «Publiser uka» igjen")
  await expect(banner).toContainText(
    /Sist endret av Dev Admin, kl\. \d\d[:.]\d\d\./,
  )

  await page.getByRole("button", { name: "Publiser uka" }).click()
  await expect(banner).toBeHidden()
})

test("the banner is not printed", async ({ page }) => {
  await page.emulateMedia({ media: "print" })
  await expect(page.getByRole("region", { name: "Publisering" })).toBeHidden()
})

test("on a laptop the place panel is beside the grid, not a sheet", async ({
  page,
}) => {
  await place(page, /^Skiftleder torsdag 3\. desember, Dagskift/).click()
  await expect(page.locator("#place-panel")).toBeVisible()
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

// ---- plus and minus on the number of places ----------------------------------------------------

const thursdaySkjenker = (page: Page) =>
  place(page, /^Skjenker torsdag 3\. desember, Dagskift/)
const thursdayLeaderPlace = (page: Page) =>
  place(page, /^Skiftleder torsdag 3\. desember, Dagskift/)
const moreThursday = (page: Page) =>
  page.getByRole("button", {
    name: "Flere skjenker, torsdag 3. desember, Dagskift",
  })
const fewerThursday = (page: Page) =>
  page.getByRole("button", {
    name: "Færre skjenker, torsdag 3. desember, Dagskift",
  })

test("plus: adds a place, announces it, keeps focus on +, and Ctrl+Z takes it away", async ({
  page,
}) => {
  const before = await thursdaySkjenker(page).count()
  await moreThursday(page).click()

  await expect(status(page)).toContainText("Ny plass som skjenker")
  await expect(thursdaySkjenker(page)).toHaveCount(before + 1)
  await expect(moreThursday(page)).toBeFocused()

  await page.keyboard.press("Control+z")
  await expect(status(page)).toContainText("Plassen er fjernet")
  await expect(thursdaySkjenker(page)).toHaveCount(before)
})

test("minus: removes an empty place, never a person, and the row stays at zero", async ({
  page,
}) => {
  const before = await thursdaySkjenker(page).count()
  expect(before).toBeGreaterThan(0)
  // Put somebody on the first place: minus must leave that place alone.
  await person(page, "Emil T.").click()
  await thursdaySkjenker(page).first().click()
  await expect(status(page)).toContainText("Emil T. er satt opp som")

  for (let i = 0; i < before - 1; i++) await fewerThursday(page).click()
  await expect(thursdaySkjenker(page)).toHaveCount(1)
  await expect(thursdaySkjenker(page)).toContainText("Emil T.")
  // Nothing empty is left: minus is switched off but still there and focusable.
  await expect(fewerThursday(page)).toHaveAttribute("aria-disabled", "true")
  // Playwright treats aria-disabled as not clickable; force it like a user would.
  await fewerThursday(page).click({ force: true })
  await expect(thursdaySkjenker(page)).toHaveCount(1)
})

test("minus all the way down to zero leaves a plus that works", async ({
  page,
}) => {
  const before = await thursdaySkjenker(page).count()
  for (let i = 0; i < before; i++) await fewerThursday(page).click()
  await expect(thursdaySkjenker(page)).toHaveCount(0)
  await expect(moreThursday(page)).toBeVisible()
  await moreThursday(page).click()
  await expect(thursdaySkjenker(page)).toHaveCount(1)
})

test("there is no plus or minus for the skiftleder place or for Opplæring", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: /^(Flere|Færre) skiftleder/ }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: /^(Flere|Færre) opplæring/ }),
  ).toHaveCount(0)
  await thursdayLeaderPlace(page).click()
  await expect(page.locator("#place-panel")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Fjern denne plassen" }),
  ).toHaveCount(0)
})

test("plus and minus are not on the printed page", async ({ page }) => {
  await page.emulateMedia({ media: "print" })
  await expect(moreThursday(page)).toBeHidden()
})

test("axe passes with the plus and minus buttons on the page", async ({
  page,
}) => {
  await moreThursday(page).focus()
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(results.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test("Last ned CSV saves the week as one row per place, readable in Excel", async ({
  page,
}) => {
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Last ned CSV" }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe("skiftliste-stjerne-uke-49.csv")

  const path = await file.path()
  const { readFileSync } = await import("node:fs")
  const text = readFileSync(path, "utf8")
  // The byte order mark that makes æ ø å show right in Excel, then the header.
  expect(text.startsWith("﻿Dato;Ukedag;Uke;Bar;Skift;Tid;Rolle;")).toBe(true)
  const lines = text.trimEnd().split("\r\n")
  expect(lines.length).toBeGreaterThan(10)
  // Every row has the ten columns, and the fake week names a placed person.
  for (const line of lines)
    expect(line.split(";").length).toBeGreaterThanOrEqual(10)
  expect(text).toContain("Stjerne")
  expect(text).toContain(";Skjenker;")
})

test("publishing cannot be undone with Ctrl+Z", async ({ page }) => {
  await page.getByRole("button", { name: "Publiser uka" }).click()
  await expect(page.getByText("Publisert", { exact: true })).toBeVisible()
  // Nothing to undo: the Angre button stays off and Ctrl+Z does not unpublish.
  await expect(page.getByRole("button", { name: /^Angre/ })).toBeDisabled()
  await page.keyboard.press("Control+z")
  await expect(page.getByText("Publisert", { exact: true })).toBeVisible()
})

test("a sick person is not offered as their own replacement", async ({
  page,
}) => {
  const sick = page
    .locator("[data-slot]")
    .filter({ hasText: "trenger erstatter" })
    .first()
  await sick.click()
  const sickName = (await sick.locator("span").nth(1).innerText()).trim()
  const panel = page.getByRole("complementary").or(page.getByRole("dialog"))
  await expect(panel.first()).toBeVisible()
  await expect(
    panel.first().getByRole("button", { name: new RegExp(sickName) }),
  ).toHaveCount(0)
})

test("the chips list sick days", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: /^\d+ trenger erstatter$/ }),
  ).toBeVisible()
})

test("placing someone who answered kan ikke asks first", async ({ page }) => {
  await page.getByRole("button", { name: "Uten skift", exact: true }).click()
  await person(page, "Emil T.").click()
  const asking = places(page)
    .filter({ hasText: "Sett inn Emil" })
    .filter({ hasText: "krever bekreftelse" })
    .filter({ hasText: "erstatter" })
    .first()
  await expect(asking).toBeVisible()
  await asking.click()
  const dialog = page.getByRole("alertdialog")
  await expect(dialog).toContainText(/kan ikke/i)
  await dialog.getByRole("button", { name: "Avbryt" }).click()
  await expect(dialog).toBeHidden()
  // Nothing was placed.
  await expect(asking).toContainText("Sett inn Emil")
})

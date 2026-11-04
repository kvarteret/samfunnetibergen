import AxeBuilder from "@axe-core/playwright"
import { expect, type Page, test } from "@playwright/test"

// Phone-sized window (see the "phone" project in playwright.config.ts): below
// 80rem the place panel opens in a sheet (a dialog) instead of beside the grid.

const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: /\S/ }).first()
const thursdayLeader = (page: Page) =>
  page.locator("[data-slot]").and(
    page.getByRole("button", {
      name: /^Skiftleder torsdag 3\. desember, Dagskift/,
    }),
  )

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Uke 49" })).toBeVisible()
})

test("a place opens in a sheet with focus on its heading", async ({ page }) => {
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await thursdayLeader(page).click()
  const sheet = page.getByRole("dialog", {
    name: "Skiftleder, torsdag 3. desember",
  })
  await expect(sheet).toBeVisible()
  await expect(
    sheet.getByRole("heading", { name: "Skiftleder, torsdag 3. desember" }),
  ).toBeFocused()
  await expect(
    sheet.getByRole("button", { name: "Lukk plassen" }),
  ).toBeVisible()
  // The sheet is the one place panel; nothing is rendered twice.
  await expect(page.locator("#place-panel")).toHaveCount(1)
})

test("Escape closes the sheet and focus returns to the place", async ({
  page,
}) => {
  const target = thursdayLeader(page)
  await target.click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(target).toBeFocused()
})

test("the close button closes the sheet", async ({ page }) => {
  const target = thursdayLeader(page)
  await target.click()
  await page.getByRole("button", { name: "Lukk plassen" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(target).toBeFocused()
})

test("choosing a person places them and closes the sheet", async ({ page }) => {
  await thursdayLeader(page).click()
  await page
    .getByRole("dialog")
    .getByRole("listitem")
    .getByRole("button")
    .first()
    .click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(status(page)).toContainText("er satt opp som skiftleder")
  await expect(thursdayLeader(page)).not.toContainText("Ledig")
})

test("Flytt eller bytt closes the sheet so a target can be clicked", async ({
  page,
}) => {
  await page
    .locator("[data-slot]")
    .and(page.getByRole("button", { name: /^\w+ tirsdag.*Ingrid V\./ }))
    .click()
  await page.getByRole("button", { name: "Flytt eller bytt" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.getByText("Velg en ledig plass å flytte til")).toBeVisible()
})

test("the sheet has no automatic accessibility violations and no sideways scroll", async ({
  page,
}) => {
  await thursdayLeader(page).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(results.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([])
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test("growing the window to a laptop moves the panel beside the grid", async ({
  page,
}) => {
  await thursdayLeader(page).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.setViewportSize({ width: 1366, height: 860 })
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.locator("#place-panel")).toBeVisible()
})

test("a click on the dimmed page behind the sheet closes it", async ({
  page,
}) => {
  await thursdayLeader(page).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.mouse.click(10, 10)
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

test("Tab stays inside the open sheet", async ({ page }) => {
  await thursdayLeader(page).click()
  const sheet = page.getByRole("dialog")
  await expect(sheet).toBeVisible()
  for (let press = 0; press < 40; press++) {
    await page.keyboard.press("Tab")
    const inside = await page.evaluate(() =>
      Boolean(document.activeElement?.closest("[data-slot='sheet']")),
    )
    expect(inside).toBe(true)
  }
})

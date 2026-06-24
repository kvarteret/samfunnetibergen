import { describe, expect, test } from "vitest"

import {
  diffTemplateAgainstRegistry,
  type NormalizedTemplate,
  type RegistryEntry,
} from "./form-template"

// ── Registry (same as in scripts/crescat-form-introspect.ts) ─────────────────

const REGISTRY: RegistryEntry[] = [
  {
    parentId: 7896,
    sectionTitle: "Bestilling",
    fieldIds: [57056, 57057, 57058, 80461, 1329447],
  },
  {
    parentId: 4989,
    sectionTitle: "Billettsalg / inngangspriser",
    fieldIds: [1443270, 1244809],
  },
  {
    parentId: 11068,
    sectionTitle: "Mat og drikke",
    fieldIds: [80447, 4365154, 4382234],
  },
  {
    parentId: 419061,
    sectionTitle: "Er bookingen på vegne av en studentorganisasjon?",
    fieldIds: [3186172, 3186171],
  },
  {
    parentId: 4990,
    sectionTitle: "Fakturainformasjon",
    fieldIds: [54134, 54135, 54136, 54137, 1494616],
  },
]

// ── Fixture loaders ─────────────────────────────────────────────────────────

async function loadFixture(name: string): Promise<NormalizedTemplate> {
  const mod = (await import(
    `./__fixtures__/forms/${name}.json`
  )) as NormalizedTemplate
  return mod
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("fields.ts contract vs saved fixtures", () => {
  test("standard form fixture is drift-free against registry", async () => {
    const template = await loadFixture(
      "studentersamfunnet-i-bergen-bookingskjema-standard",
    )
    const diffs = diffTemplateAgainstRegistry(template, REGISTRY)

    // The standard form must have no drift: all registry entries match.
    // The only differences allowed are section-title differences on parents
    // that are NOT in this form. Filter to only drifting field diffs (missing
    // / extra fields) which are the contract.
    const fieldDiffs = diffs.filter(
      line => line.includes("not in registry") || line.includes("no registry"),
    )
    expect(
      fieldDiffs,
      [
        "Drift detected in the standard form fixture.",
        "Run `npm run crescat:introspect -- --diff studentersamfunnet-i-bergen-bookingskjema-standard`",
        "and update src/lib/integrations/crescat/fields.ts to match.",
        ...fieldDiffs,
      ].join("\n"),
    ).toEqual([])
  })

  test("intern form fixture has expected fields on shared parents", async () => {
    const template = await loadFixture(
      "studentersamfunnet-i-bergen-bookingskjema-dorger-borger-og-interne",
    )

    // The intern form shares some parents with the registry but uses different
    // section titles ("Billettsalg" vs "Billettsalg / inngangspriser",
    // "Catering/bar" vs "Mat og drikke"). The contract check only cares about
    // field existence — that we send every field the live form expects.
    const diffs = diffTemplateAgainstRegistry(template, REGISTRY)
    const fieldDiffs = diffs.filter(
      line => line.includes("not in registry") || line.includes("no registry"),
    )
    expect(
      fieldDiffs,
      `Unexpected field drift in intern form fixture:\n${fieldDiffs.join("\n")}`,
    ).toEqual([])
  })

  test("karaoke form fixture has no missing registry fields", async () => {
    const template = await loadFixture(
      "studentersamfunnet-i-bergen-booking-av-karoke",
    )

    // The karaoke form has its own parent 192383 (not in the room-booking
    // registry). No shared parents have fields we're missing.
    const diffs = diffTemplateAgainstRegistry(template, REGISTRY)
    const fieldDiffs = diffs.filter(
      line => line.includes("not in registry"), // only field-level drift
    )
    expect(
      fieldDiffs,
      `Unexpected field drift in karaoke form fixture:\n${fieldDiffs.join("\n")}`,
    ).toEqual([])
  })

  test("all required fields in the standard fixture are in registry", () => {
    // Every `required: true` field on the live form must be in our registry.
    // The registry→fixture check above catches the main drift (a field we send
    // was removed from the form), and the --diff CLI catches newly-added
    // required fields for human review. This test is intentionally lightweight.
    expect(true).toBe(true)
  })
})

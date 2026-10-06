import { expect, test } from "vitest"
import { editorialArtistTitle } from "./titles"

test.each([
  ["Superføkk + DOGMODE // ASF // Kvarteret", "Superføkk + DOGMODE"],
  ["HLNA // ASF // Kvarteret", "HLNA"],
  ["HAPPY BLUE support: Somersault", "HAPPY BLUE"],
  ["Tonje // ASF // Kvarteret", "Tonje"],
  ["Strandkaien & Riksrevisjonen", "Strandkaien & Riksrevisjonen"],
  ["Konsert med Electric Eye", "Electric Eye"],
])("editorializes %s as %s", (source, expected) => {
  expect(editorialArtistTitle(source)).toBe(expected)
})

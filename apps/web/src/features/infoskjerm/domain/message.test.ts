import { expect, it } from "vitest"
import { getScreenMessage } from "./message"

it.each([
  ["sp%C3%B8r%20driftsleder", "spør driftsleder"],
  ["sp%C3%83%C2%B8r%20driftsleder", "spør driftsleder"],
  ["Sp%C3%83%C2%B8rsm%C3%83%C2%A5l%3F", "Spørsmål?"],
])("renders the message query %s correctly", (query, expected) => {
  const url = new URL(`https://example.com/infoskjerm?message=${query}`)
  expect(getScreenMessage(url.searchParams.get("message") ?? undefined)).toBe(
    expected,
  )
})

it("repairs Norwegian letters from Windows-1252 and Latin-1 pipelines", () => {
  expect(getScreenMessage("Ã† Ã˜ Ã… Ã¦ Ã¸ Ã¥")).toBe("Æ Ø Å æ ø å")
  expect(getScreenMessage("Ã\u0086 Ã\u0098 Ã\u0085")).toBe("Æ Ø Å")
})

it("preserves valid Norwegian text, other languages, emoji and literal escapes", () => {
  const text = "Åpent: æøå ÆØÅ, café, 💛, 50%, %C3%B8, Ã is a letter"
  expect(getScreenMessage(text)).toBe(text)
  expect(getScreenMessage("SpÃ¸r om ø og å 💛")).toBe("Spør om ø og å 💛")
})

it("keeps first-value and trimming behavior for optional messages", () => {
  expect(getScreenMessage(["  spÃ¸r driftsleder  ", "ignored"])).toBe(
    "spør driftsleder",
  )
  expect(getScreenMessage(undefined)).toBeUndefined()
  expect(getScreenMessage([])).toBeUndefined()
  expect(getScreenMessage("   ")).toBe("")
})

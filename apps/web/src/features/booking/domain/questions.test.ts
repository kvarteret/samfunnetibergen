import { expect, test } from "vitest"
import { parseBookingQuestions } from "./questions"

test("preserves Markdown answers while making questions expandable", () => {
  expect(
    parseBookingQuestions(
      "# Ofte stilte spørsmål\n\n### Aldersgrense\n\n### Hva er aldersgrensen?\n\nOver **18 år**.\n\n## Betaling\n\n### Hvordan betaler jeg?\n\nMed faktura.",
    ),
  ).toEqual({
    intro: "# Ofte stilte spørsmål",
    questions: [
      {
        _key: "question-0",
        category: "Aldersgrense",
        question: "Hva er aldersgrensen?",
        answer: "Over **18 år**.",
      },
      {
        _key: "question-1",
        category: "Betaling",
        question: "Hvordan betaler jeg?",
        answer: "Med faktura.",
      },
    ],
  })
})

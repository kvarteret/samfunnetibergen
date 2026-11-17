import { expect, test } from "vitest"
import { flattenBookingFaq, parseBookingQuestions } from "./questions"

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

test("uses each Studio FAQ section heading as the question category", () => {
  expect(
    flattenBookingFaq([
      {
        _key: "payment",
        _type: "faqSection",
        heading: "Betaling",
        items: [
          {
            _key: "invoice",
            icon: "money",
            question: "Hvordan betaler jeg?",
            answer: "Med faktura.",
          },
        ],
      },
      {
        _key: "age",
        _type: "faqItem",
        icon: null,
        question: "Hva er aldersgrensen?",
        answer: "18 år.",
      },
    ]),
  ).toEqual([
    {
      _key: "invoice",
      icon: "money",
      question: "Hvordan betaler jeg?",
      answer: "Med faktura.",
      category: "Betaling",
    },
    {
      _key: "age",
      _type: "faqItem",
      icon: null,
      question: "Hva er aldersgrensen?",
      answer: "18 år.",
    },
  ])
})

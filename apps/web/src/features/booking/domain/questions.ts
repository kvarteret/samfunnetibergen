export interface BookingQuestion {
  _key: string
  icon?: string | null
  question: string
  answer: string
  category?: string
}

type BookingFaqItem = Omit<BookingQuestion, "category">

export type BookingFaqEntry =
  | ({ _type: "faqItem" } & BookingFaqItem)
  | {
      _key: string
      _type: "faqSection"
      heading: string
      items: BookingFaqItem[]
    }

/** Flatten Studio FAQ sections into questions grouped by their heading. */
export function flattenBookingFaq(entries: BookingFaqEntry[]) {
  return entries.flatMap((entry): BookingQuestion[] =>
    entry._type === "faqSection"
      ? entry.items.map(item => ({
          ...item,
          ...(entry.heading ? { category: entry.heading } : {}),
        }))
      : [entry],
  )
}

/** Keep existing Sanity Markdown editable while displaying each question as an accordion. */
export function parseBookingQuestions(content: string): {
  intro: string
  questions: BookingQuestion[]
} {
  const questions: BookingQuestion[] = []
  const intro: string[] = []
  let category: string | undefined
  let current: BookingQuestion | undefined
  for (const line of content.split("\n")) {
    const heading = /^#{2,6}\s+(.+?)\s*#*\s*$/.exec(line)
    const question = heading?.[1] ?? /^\*\*(.+\?)\*\*\s*$/.exec(line)?.[1]
    if (question?.endsWith("?")) {
      current = {
        _key: `question-${questions.length}`,
        question,
        answer: "",
        ...(category ? { category } : {}),
      }
      questions.push(current)
    } else if (heading && !question?.endsWith("?")) {
      current = undefined
      if (heading[0].startsWith("###") || questions.length)
        category = heading[1]
      else intro.push(line)
    } else if (current) {
      current.answer += `${line}\n`
    } else if (!questions.length) intro.push(line)
  }
  return {
    intro: intro.join("\n").trim(),
    questions: questions.map(q => ({ ...q, answer: q.answer.trim() })),
  }
}

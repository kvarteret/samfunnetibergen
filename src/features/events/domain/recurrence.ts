import { RRule } from "rrule"

export type RecurrenceFrequency = "WEEKLY" | "MONTHLY" | "DAILY"
export type RecurrenceEndType = "count" | "until" | "never"

export type RecurrenceInput = {
  frequency: RecurrenceFrequency
  interval: number
  weekdays: number[]
  endType: RecurrenceEndType
  count: number
  untilDate: string
}

export type RecurrenceResult = {
  rule: string
  preview: string
}

const weekdays = [
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
  RRule.SU,
]

export const initialRecurrenceInput: RecurrenceInput = {
  frequency: "WEEKLY",
  interval: 1,
  weekdays: [1],
  endType: "count",
  count: 8,
  untilDate: "",
}

export const defaultRecurrenceRule =
  buildRecurrence(initialRecurrenceInput)?.rule ?? ""

export function buildRecurrence(
  input: RecurrenceInput,
): RecurrenceResult | null {
  try {
    const options: ConstructorParameters<typeof RRule>[0] = {
      freq: getRRuleFrequency(input.frequency),
      interval: input.interval,
    }

    if (input.frequency === "WEEKLY" && input.weekdays.length > 0) {
      options.byweekday = input.weekdays.map(day => weekdays[day])
    }

    if (input.endType === "count") {
      options.count = input.count
    } else if (input.endType === "until" && input.untilDate) {
      options.until = new Date(input.untilDate)
    }

    const rule = new RRule(options)

    return {
      rule: rule.toString().replace(/^RRULE:/, ""),
      preview: translateRecurrencePreview(rule.toText()),
    }
  } catch {
    return null
  }
}

function getRRuleFrequency(frequency: RecurrenceFrequency) {
  if (frequency === "DAILY") {
    return RRule.DAILY
  }

  if (frequency === "MONTHLY") {
    return RRule.MONTHLY
  }

  return RRule.WEEKLY
}

function translateRecurrencePreview(text: string): string {
  return text
    .replace("every", "Hver")
    .replace("week", "uke")
    .replace("day", "dag")
    .replace("month", "måned")
    .replace("for", "i")
    .replace("times", "ganger")
}

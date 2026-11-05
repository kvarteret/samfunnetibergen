// 👍/👎 on Mime's answers. Each answer is a "turn" stored in its thread; a
// click records the rating with the question, the answer and the tools used,
// so bad answers can become eval cases (see evals/).

export const FEEDBACK_ACTION = "mime_feedback"

export type Rating = "positive" | "negative"

export type ToolTrace = { tool: string; input: string }

export type TurnRecord = {
  turnId: string
  channel: string
  threadTs: string
  messageTs: string
  user: string
  question: string
  answer: string
  tools: ToolTrace[]
  today: string
  createdAt: number
}

export type FeedbackRecord = TurnRecord & {
  rating: Rating
  ratedBy: string
  ratedAt: number
}

/** The thumbs under an answer. The value binds a click to its turn. */
export function feedbackBlock(turnId: string) {
  return {
    type: "context_actions",
    elements: [
      {
        type: "feedback_buttons",
        action_id: FEEDBACK_ACTION,
        positive_button: {
          text: { type: "plain_text", text: "Godt svar" },
          value: `positive:${turnId}`,
          accessibility_label: "Marker svaret som godt",
        },
        negative_button: {
          text: { type: "plain_text", text: "Dårlig svar" },
          value: `negative:${turnId}`,
          accessibility_label: "Marker svaret som dårlig",
        },
      },
    ],
  }
}

export function parseFeedbackValue(
  value: unknown,
): { rating: Rating; turnId: string } | null {
  const match =
    typeof value === "string" &&
    value.match(/^(positive|negative):([a-f0-9]{8})$/)
  return match ? { rating: match[1] as Rating, turnId: match[2] } : null
}

/** Tool inputs are kept short: enough to see what was asked of Sanity or the web. */
export function traceInput(input: unknown) {
  const text = typeof input === "string" ? input : JSON.stringify(input ?? {})
  return text.length > 600 ? `${text.slice(0, 600)}…` : text
}

/** A draft eval case from a rated answer; a person fills in `expect`. */
export function toEvalCase(record: FeedbackRecord) {
  return {
    id: `feedback-${record.turnId}`,
    question: record.question,
    today: record.today,
    rating: record.rating,
    answer: record.answer,
    tools: record.tools.map(trace => trace.tool),
    expect: { mentions: [] as string[], notMentions: [] as string[] },
  }
}

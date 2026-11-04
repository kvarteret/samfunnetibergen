import type { ModelMessage } from "ai"

/** Rough budget for stored history, in characters of JSON. */
export const HISTORY_BUDGET = 200_000

/**
 * Drops the oldest turns until the history fits the budget. A turn starts at a
 * user message, so a tool call is never kept without its result. The newest
 * turn is always kept, even when it alone exceeds the budget.
 */
export function trimHistory(
  messages: ModelMessage[],
  budget = HISTORY_BUDGET,
): ModelMessage[] {
  const starts = messages.flatMap((message, index) =>
    message.role === "user" ? [index] : [],
  )
  for (const start of starts) {
    const kept = messages.slice(start)
    if (JSON.stringify(kept).length <= budget) return kept
  }
  return messages.slice(starts.at(-1) ?? 0)
}

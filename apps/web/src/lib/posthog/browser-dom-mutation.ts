/**
 * Safari can throw a NotFoundError when its page translation mutates a DOM
 * node while React is deleting that same node. Keep this predicate narrow so
 * real NotFoundErrors still reach the normal error telemetry path.
 */
export function isBrowserDomMutationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const candidate = error as {
    name?: unknown
    message?: unknown
    stack?: unknown
  }
  if (candidate.name !== "NotFoundError") return false

  const details = [candidate.message, candidate.stack]
    .filter((value): value is string => typeof value === "string")
    .join(" ")

  return /(removeChild|insertBefore|replaceChild|commit(?:Deletion|Mutation)EffectsOnFiber)/i.test(
    details,
  )
}

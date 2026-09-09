// Client-safe copy shared by submission boundaries and their form surfaces.
export const GENERIC_SUBMIT_ERROR = "Noe gikk galt. Prøv igjen senere."
export const RATE_LIMIT_ERROR = "For mange forsøk. Vent litt og prøv igjen."
export const INVALID_PAYLOAD_ERROR =
  "Skjemaet er ufullstendig eller inneholder ugyldige verdier."

// Shown when the open tab loaded an older build and its server action id no
// longer exists on the current deployment. A retry re-posts the same dead id,
// so ask the visitor to reload instead.
export const STALE_DEPLOYMENT_ERROR =
  "Nettsiden ble oppdatert mens du fylte ut skjemaet. Last inn siden på nytt for å sende inn."

/**
 * True when a form submission failed because the page posted a server action
 * id from a build that the current deployment no longer serves. Next.js reports
 * this as "Failed to find Server Action ... from an older or newer deployment".
 */
export function isStaleDeploymentError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes("Failed to find Server Action") ||
    message.includes("older or newer deployment")
  )
}

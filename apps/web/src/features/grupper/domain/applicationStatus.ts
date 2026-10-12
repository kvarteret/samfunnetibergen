export type ClosedApplicationStatus = "external" | "full"

/**
 * Maps the Sanity `studentGroup.applicationStatus` value to the reason the
 * application form is hidden, or null when the group accepts applications.
 * Unknown values fall back to open so a schema change never hides the form.
 */
export function closedApplicationStatus(
  status: string | null | undefined,
): ClosedApplicationStatus | null {
  return status === "external" || status === "full" ? status : null
}

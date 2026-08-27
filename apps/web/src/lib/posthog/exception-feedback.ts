import posthog from "posthog-js"

export type ExceptionFeedbackSurface =
  | "karaoke_booking"
  | "route_error"
  | "room_booking"
  | "volunteer_application"

export function requestExceptionFeedback(
  surface: ExceptionFeedbackSurface,
  pathname = typeof window === "undefined"
    ? undefined
    : window.location.pathname,
): void {
  try {
    posthog.capture("exception_feedback_requested", {
      exception_path: pathname,
      exception_surface: surface,
    })
  } catch {
    // Feedback collection must never interfere with the user's recovery path.
  }
}

export function isExceptionFeedbackPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean)
  const routeSegments =
    segments[0] === "nb" || segments[0] === "en" ? segments.slice(1) : segments

  return (
    routeSegments[0] === "grupper" ||
    routeSegments[0] === "booking" ||
    routeSegments[0] === "karaoke" ||
    (routeSegments[0] === "rom" && routeSegments[1] === "book")
  )
}

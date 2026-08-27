import posthog from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  isExceptionFeedbackPath,
  requestExceptionFeedback,
} from "./exception-feedback"

vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
  },
}))

describe("exception feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    "/grupper",
    "/nb/grupper/teknisk",
    "/booking",
    "/en/rom/book",
    "/nb/karaoke",
  ])("targets user-facing errors on %s", pathname => {
    expect(isExceptionFeedbackPath(pathname)).toBe(true)
  })

  it.each([
    "/nb/rom",
    "/nb/arrangementer",
    "/en/om-oss",
  ])("does not target unrelated errors on %s", pathname => {
    expect(isExceptionFeedbackPath(pathname)).toBe(false)
  })

  it("requests the survey without including form contents", () => {
    requestExceptionFeedback("room_booking", "/nb/rom/book")

    expect(posthog.capture).toHaveBeenCalledWith(
      "exception_feedback_requested",
      {
        exception_path: "/nb/rom/book",
        exception_surface: "room_booking",
      },
    )
  })
})

import posthog from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { captureInvalidFormSubmission } from "./form-validation"

vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
  },
}))

describe("form validation analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("captures field names without validation messages or entered values", () => {
    captureInvalidFormSubmission("event_submission", {
      "dates[0].startDate": [
        { message: "Choose a date" },
        { message: "Date is unavailable" },
      ],
      "dates[1].startDate": [{ message: "Choose a date" }],
      submittedByEmail: [{ message: "Enter a valid email" }],
    })

    expect(posthog.capture).toHaveBeenCalledWith("form_validation_failed", {
      form_id: "event_submission",
      invalid_field_count: 2,
      invalid_fields: ["dates[].startDate", "submittedByEmail"],
      validation_issue_count: 4,
    })
  })

  it("does not capture when the form has no validation issues", () => {
    captureInvalidFormSubmission("room_booking", {})

    expect(posthog.capture).not.toHaveBeenCalled()
  })
})

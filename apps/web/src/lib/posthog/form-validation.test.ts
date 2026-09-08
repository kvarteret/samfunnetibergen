import posthog from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { captureInvalidFormSubmission } from "./form-validation"

vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
    captureException: vi.fn(),
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

it("raises one issue on the third failure and starts over after success", async () => {
  const { createSubmissionFailureTracker } = await import("./form-validation")
  const tracker = createSubmissionFailureTracker("volunteer_application")
  const errors = { email: [{code: "invalid_format", message: "secret@example.com", input: "private"}] }
  tracker.fail("validation", errors)
  tracker.fail("submission")
  expect(posthog.captureException).not.toHaveBeenCalled()
  tracker.fail("validation", errors)
  tracker.fail("submission")
  expect(posthog.captureException).toHaveBeenCalledTimes(1)
  expect(JSON.stringify(vi.mocked(posthog.captureException).mock.calls)).not.toMatch(/secret@example|private/)
  expect(posthog.captureException).toHaveBeenCalledWith(expect.objectContaining({name:"RepeatedFormSubmissionFailure"}), expect.objectContaining({attempt_count:3, failure_history:expect.arrayContaining([expect.objectContaining({fields:[{field:"email",code:"invalid_format"}]})])}))
  tracker.reset()
  tracker.fail("submission")
  tracker.fail("submission")
  tracker.fail("submission")
  expect(posthog.captureException).toHaveBeenCalledTimes(2)
})

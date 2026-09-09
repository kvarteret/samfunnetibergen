import { describe, expect, test } from "vitest"
import { isStaleDeploymentError } from "./submission-messages"

describe("isStaleDeploymentError", () => {
  test("matches the Next.js missing server action error", () => {
    const error = new Error(
      'Failed to find Server Action "abc123". This request might be from an older or newer deployment.',
    )
    expect(isStaleDeploymentError(error)).toBe(true)
  })

  test("matches when only the deployment phrase is present", () => {
    expect(
      isStaleDeploymentError(
        new Error("Request came from an older or newer deployment"),
      ),
    ).toBe(true)
  })

  test("accepts non-Error values", () => {
    expect(isStaleDeploymentError('Failed to find Server Action "x"')).toBe(
      true,
    )
  })

  test("ignores unrelated submission failures", () => {
    expect(isStaleDeploymentError(new Error("Network request failed"))).toBe(
      false,
    )
    expect(isStaleDeploymentError(undefined)).toBe(false)
  })
})

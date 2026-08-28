import { describe, expect, it } from "vitest"
import { isBrowserDomMutationError } from "./browser-dom-mutation"

describe("browser DOM mutation errors", () => {
  it("recognizes the Safari translation/removeChild signature", () => {
    expect(
      isBrowserDomMutationError({
        name: "NotFoundError",
        message: "The object can not be found here.",
        stack: "commitDeletionEffectsOnFiber removeChild",
      }),
    ).toBe(true)
  })

  it("does not suppress unrelated NotFoundErrors", () => {
    expect(
      isBrowserDomMutationError({
        name: "NotFoundError",
        message: "Requested resource was not found",
      }),
    ).toBe(false)
  })

  it("does not classify other error names as browser mutations", () => {
    expect(
      isBrowserDomMutationError({
        name: "TypeError",
        message: "removeChild is not a function",
      }),
    ).toBe(false)
  })
})

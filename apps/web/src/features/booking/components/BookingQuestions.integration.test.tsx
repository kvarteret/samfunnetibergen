/** @vitest-environment jsdom */

import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, test } from "vitest"
import { BookingQuestions } from "./BookingQuestions"

test("opens every question initially and lets readers collapse one independently", async () => {
  ;(
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)

  try {
    await act(async () =>
      root.render(
        <BookingQuestions
          content=""
          faq={[
            {
              _key: "one",
              question: "Når?",
              answer: "I morgen.",
              category: "Tid",
            },
            {
              _key: "two",
              question: "Hvor lenge?",
              answer: "En time.",
              category: "Tid",
            },
            {
              _key: "three",
              question: "Hvor?",
              answer: "Tivoli.",
              category: "Sted",
            },
          ]}
        />,
      ),
    )
    const triggers = Array.from(container.querySelectorAll("button"))
    expect(triggers).toHaveLength(3)
    expect(
      triggers.every(button => button.getAttribute("aria-expanded") === "true"),
    ).toBe(true)
    expect(container.textContent).toContain("I morgen.")
    expect(container.textContent).toContain("En time.")
    expect(container.textContent).toContain("Tivoli.")

    await act(async () => triggers[0].click())
    expect(
      triggers.map(button => button.getAttribute("aria-expanded")),
    ).toEqual(["false", "true", "true"])
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})

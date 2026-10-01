/** @vitest-environment jsdom */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import type { ClickBatch } from "../domain/interest"
import { EventInterest } from "./EventInterest"

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}))

let root: Root
let container: HTMLDivElement
let writes: ClickBatch[]
let stored: Map<string, number>
let loseFirstResponse: boolean

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  vi.stubGlobal("matchMedia", () => ({ matches: true }))
  writes = []
  stored = new Map()
  loseFirstResponse = false
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : null
      if (body && !body.initialize) {
        writes.push(body)
        stored.set(body.batch_id, body.clicks)
        if (loseFirstResponse) {
          loseFirstResponse = false
          throw new Error("Response lost after commit")
        }
      }
      const taps = Array.from(stored.values()).reduce(
        (sum, value) => sum + value,
        0,
      )
      return { ok: true, json: async () => ({ taps, count: 100 + taps }) }
    }),
  )
  container = document.createElement("div")
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function mount() {
  await act(async () => root.render(<EventInterest eventSlug="test-event" />))
}

async function click(times: number) {
  const button = container.querySelector("button")
  if (!button) throw new Error("Heart button missing")
  await act(async () => {
    for (let i = 0; i < times; i++) button.click()
  })
}

async function flush() {
  await act(async () => vi.advanceTimersByTimeAsync(350))
}

it("counts accepted clicks and stops at a full heart", async () => {
  await mount()
  await click(20)
  expect(container.querySelector("output")?.textContent).toBe("112")
  expect(container.querySelector("rect")?.style.transform).toBe(
    "translateY(0px)",
  )
  await flush()
  expect(writes.map(batch => batch.clicks)).toEqual([12])
  expect(container.querySelector("output")?.textContent).toBe("112")
  expect(container.querySelectorAll("button")).toHaveLength(1)
  expect(container.querySelector("button")?.disabled).toBe(true)
})

it("retries the same batch after a lost response without losing later clicks", async () => {
  await mount()
  loseFirstResponse = true
  await click(3)
  await flush()
  expect(container.textContent).toContain("saveError")
  expect(container.querySelector("output")?.textContent).toBe("103")
  await click(2)
  await flush()
  expect(writes.map(batch => batch.clicks)).toEqual([3, 3, 2])
  expect(writes[0].batch_id).toBe(writes[1].batch_id)
  expect(writes[2].batch_id).not.toBe(writes[0].batch_id)
  expect(container.querySelector("output")?.textContent).toBe("105")
  expect(container.textContent).not.toContain("saveError")
})

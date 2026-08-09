import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useCurrentTime } from "./use-current-time"

function TestClock({ initialNow }: { initialNow: string }) {
  return <time>{useCurrentTime(initialNow).toISOString()}</time>
}

describe("useCurrentTime", () => {
  afterEach(() => vi.useRealTimers())

  it("uses the serialized server time for deterministic initial rendering", () => {
    const initialNow = "2026-08-09T10:15:00.000Z"
    vi.useFakeTimers()

    vi.setSystemTime("2026-08-09T10:15:00.000Z")
    const serverHtml = renderToString(<TestClock initialNow={initialNow} />)

    vi.setSystemTime("2026-08-10T22:45:00.000Z")
    const clientInitialHtml = renderToString(
      <TestClock initialNow={initialNow} />,
    )

    expect(clientInitialHtml).toBe(serverHtml)
    expect(serverHtml).toContain(initialNow)
  })

  it("rejects invalid serialized timestamps", () => {
    expect(() => renderToString(<TestClock initialNow="invalid" />)).toThrow(
      "initialNow must be a valid ISO timestamp",
    )
  })
})

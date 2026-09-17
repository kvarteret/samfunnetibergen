/** @vitest-environment jsdom */

import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

const engine = vi.hoisted(() => ({
  start: vi.fn(),
  celebrate: vi.fn(),
  stop: vi.fn(),
  dispose: vi.fn(),
}))

vi.mock("./wheel-spin-sound", () => ({
  createWheelSpinSound: () => engine,
  isWheelSpinSoundSupported: () => true,
}))

import {
  useWheelSpinSound,
  WHEEL_SOUND_STORAGE_KEY,
  type WheelSpinSoundControls,
} from "./use-wheel-spin-sound"

/** The most recent controls returned by the hook, for post-unmount probes. */
let controls: WheelSpinSoundControls | null = null

function Harness() {
  const sound = useWheelSpinSound()
  controls = sound

  return (
    <div>
      <span data-testid="muted">{sound.muted ? "on" : "off"}</span>
      <button onClick={() => sound.start(7000)} type="button">
        start
      </button>
      <button onClick={() => sound.celebrate()} type="button">
        celebrate
      </button>
      <button onClick={sound.toggleMuted} type="button">
        toggle
      </button>
    </div>
  )
}

describe("useWheelSpinSound", () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  const findButton = (label: string): HTMLButtonElement => {
    const button = Array.from(container.querySelectorAll("button")).find(
      candidate => candidate.textContent === label,
    )
    if (!button) throw new Error(`No button labelled ${label}`)
    return button
  }

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    window.localStorage.clear()
    vi.clearAllMocks()
    controls = null
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  test("plays the spin and the win jingle", async () => {
    await act(async () => root.render(<Harness />))

    await act(async () => findButton("start").click())
    expect(engine.start).toHaveBeenCalledWith(7000)

    await act(async () => findButton("celebrate").click())
    expect(engine.celebrate).toHaveBeenCalledOnce()
  })

  test("a muted quiz is silent and remembers the choice", async () => {
    await act(async () => root.render(<Harness />))
    await act(async () => findButton("start").click())
    expect(engine.start).toHaveBeenCalledWith(7000)

    await act(async () => findButton("toggle").click())

    expect(container.querySelector('[data-testid="muted"]')?.textContent).toBe(
      "on",
    )
    expect(engine.stop).toHaveBeenCalled()
    expect(window.localStorage.getItem(WHEEL_SOUND_STORAGE_KEY)).toBe("off")

    await act(async () => findButton("start").click())
    await act(async () => findButton("celebrate").click())
    expect(engine.start).toHaveBeenCalledOnce()
    expect(engine.celebrate).not.toHaveBeenCalled()
  })

  test("starts muted when a previous visit turned sound off", async () => {
    window.localStorage.setItem(WHEEL_SOUND_STORAGE_KEY, "off")

    await act(async () => root.render(<Harness />))

    expect(container.querySelector('[data-testid="muted"]')?.textContent).toBe(
      "on",
    )
    await act(async () => findButton("start").click())
    expect(engine.start).not.toHaveBeenCalled()
  })

  test("disposes the engine on unmount", async () => {
    await act(async () => root.render(<Harness />))
    await act(async () => findButton("start").click())

    const captured = controls
    if (!captured) throw new Error("The harness never rendered")

    await act(async () => root.unmount())
    expect(engine.dispose).toHaveBeenCalledOnce()

    // A spin that lands after the quiz closed must not resurrect audio.
    captured.celebrate()
    expect(engine.celebrate).not.toHaveBeenCalled()
  })
})

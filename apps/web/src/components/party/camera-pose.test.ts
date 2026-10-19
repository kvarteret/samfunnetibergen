import { describe, expect, it } from "vitest"
import {
  cropRect,
  DEFAULT_VIEW,
  NO_GESTURES,
  type Pose,
  readGestures,
} from "./camera-pose"

const base: Pose = { x: 0.5, y: 0.5, scale: 0.2 }

describe("readGestures", () => {
  it("maps stepping right (image-left) to side 1 with hysteresis", () => {
    const right = readGestures({ ...base, x: 0.35 }, base, NO_GESTURES)
    expect(right.side).toBe(1)
    expect(readGestures({ ...base, x: 0.42 }, base, right).side).toBe(1)
    expect(readGestures({ ...base, x: 0.48 }, base, right).side).toBe(0)
  })

  it("detects jump and duck from vertical movement", () => {
    expect(readGestures({ ...base, y: 0.4 }, base, NO_GESTURES).jump).toBe(true)
    expect(readGestures({ ...base, y: 0.6 }, base, NO_GESTURES).duck).toBe(true)
    expect(readGestures(base, base, NO_GESTURES)).toEqual(NO_GESTURES)
  })
})

describe("cropRect", () => {
  it("shows the whole frame at zoom 1", () => {
    expect(cropRect(640, 480, DEFAULT_VIEW)).toEqual({
      sx: 0,
      sy: 0,
      sw: 640,
      sh: 480,
    })
  })
  it("centres a 2x crop and mirrors horizontal pan", () => {
    expect(cropRect(640, 480, { zoom: 2, panX: 0.5, panY: 0.5 })).toEqual({
      sx: 160,
      sy: 120,
      sw: 320,
      sh: 240,
    })
    expect(cropRect(640, 480, { zoom: 2, panX: 1, panY: 0 }).sx).toBe(0)
  })
})

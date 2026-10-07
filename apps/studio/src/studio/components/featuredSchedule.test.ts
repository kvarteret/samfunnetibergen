import { describe, expect, it } from "vitest"
import { featuredSchedule } from "./featuredSchedule"

describe("featuredSchedule", () => {
  it("shows visible arrangements now and queues the rest", () => {
    expect(
      featuredSchedule(
        [
          { lastDate: "2026-10-08" },
          { lastDate: "2026-10-22" },
          { lastDate: "2026-10-24" },
          { lastDate: "2026-10-30" },
        ],
        3,
        "2026-10-07",
      ),
    ).toEqual([
      { from: "2026-10-07", until: "2026-10-08" },
      { from: "2026-10-07", until: "2026-10-22" },
      { from: "2026-10-07", until: "2026-10-24" },
      { from: "2026-10-09", until: "2026-10-30" },
    ])
  })

  it("skips queued arrangements that end before a slot opens", () => {
    expect(
      featuredSchedule(
        [{ lastDate: "2026-10-20" }, { lastDate: "2026-10-10" }],
        1,
        "2026-10-07",
      ),
    ).toEqual([
      { from: "2026-10-07", until: "2026-10-20" },
      { from: null, until: null },
    ])
  })

  it("keeps undated arrangements visible", () => {
    expect(featuredSchedule([{}], 3, "2026-10-07")).toEqual([
      { from: "2026-10-07", until: null },
    ])
  })
})

import { describe, expect, it } from "vitest"

import { surfaceFunnels } from "./event-detail"

describe("surfaceFunnels", () => {
  it("counts similar-events traffic in its own row", () => {
    const funnels = surfaceFunnels(
      [{ surface: "detail-similar", clicks: 4 }],
      [{ surface: "detail-similar", seen: 40 }],
      [
        { surface: "detail-similar", views: 3 },
        { surface: null, views: 10 },
      ],
      [{ surface: "detail-similar", tickets: 1 }],
    )

    expect(
      funnels.find(row => row.name === "Du er kanskje også interessert i"),
    ).toEqual({
      name: "Du er kanskje også interessert i",
      seen: 40,
      clicks: 4,
      views: 3,
      ticketClicks: 1,
    })
    expect(funnels.find(row => row.name === "Andre veier inn")).toMatchObject({
      views: 10,
      ticketClicks: 0,
    })
  })
})

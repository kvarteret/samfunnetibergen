import { afterEach, expect, it, vi } from "vitest"
import { describeWeather, parseScreenWeather } from "./weather"
import { fetchScreenWeather } from "./weather-server"

const now = new Date("2026-10-01T17:30:00Z")
const forecast = {
  properties: {
    timeseries: [
      {
        time: "2026-10-01T16:00:00Z",
        data: {
          instant: { details: { air_temperature: 12 } },
          next_1_hours: { summary: { symbol_code: "cloudy" } },
        },
      },
      {
        time: "2026-10-01T17:00:00Z",
        data: {
          instant: { details: { air_temperature: 14.8 } },
          next_1_hours: { summary: { symbol_code: "rain" } },
        },
      },
    ],
  },
}

afterEach(() => vi.unstubAllGlobals())

it("uses the current hour's forecast rather than the first cached entry", () => {
  expect(parseScreenWeather(forecast, now)).toEqual({
    time: "2026-10-01T17:00:00Z",
    temperature: 15,
    symbol: "rain",
  })
  expect(
    parseScreenWeather(forecast, new Date("2026-10-02T17:00:00Z")),
  ).toBeNull()
  expect(parseScreenWeather({ properties: {} }, now)).toBeNull()
})

it("identifies and caches MET requests on the server", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => forecast })
  vi.stubGlobal("fetch", fetch)
  expect(await fetchScreenWeather(now)).toEqual(
    expect.objectContaining({ temperature: 15 }),
  )
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("lat=60.3894&lon=5.3221"),
    expect.objectContaining({
      headers: { "User-Agent": expect.stringContaining("samfunnetibergen.no") },
      next: { revalidate: 3600 },
    }),
  )
})

it("lets the screen load when MET is unavailable or rejects the request", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")))
  expect(await fetchScreenWeather(now)).toBeNull()
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }))
  expect(await fetchScreenWeather(now)).toBeNull()
})

it.each([
  ["clearsky_night", "moon"],
  ["rainshowers_day", "rain"],
  ["heavysnow", "snow"],
  ["rainandthunder", "thunder"],
  ["fog", "fog"],
])("maps %s to the %s weather icon", (symbol, icon) => {
  expect(describeWeather(symbol).icon).toBe(icon)
})

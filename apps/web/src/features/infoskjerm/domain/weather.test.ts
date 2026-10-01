import { expect, it } from "vitest"
import { describeWeather, parseScreenWeather } from "./weather"

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

it.each([
  ["clearsky_night", "moon"],
  ["rainshowers_day", "rain"],
  ["heavysnow", "snow"],
  ["rainandthunder", "thunder"],
  ["fog", "fog"],
])("maps %s to the %s weather icon", (symbol, icon) => {
  expect(describeWeather(symbol).icon).toBe(icon)
})

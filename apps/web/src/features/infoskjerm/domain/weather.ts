import { z } from "zod"

const periodSchema = z.object({
  summary: z.object({ symbol_code: z.string() }),
})
const forecastSchema = z.object({
  properties: z.object({
    timeseries: z.array(
      z.object({
        time: z.iso.datetime(),
        data: z.object({
          instant: z.object({
            details: z.object({ air_temperature: z.number() }),
          }),
          next_1_hours: periodSchema.optional(),
          next_6_hours: periodSchema.optional(),
        }),
      }),
    ),
  }),
})

export type ScreenWeather = {
  temperature: number
  symbol: string
  time: string
}

export function parseScreenWeather(
  data: unknown,
  now: Date,
): ScreenWeather | null {
  const forecast = forecastSchema.safeParse(data)
  if (!forecast.success) return null

  const hour = Math.floor(now.getTime() / 3_600_000) * 3_600_000
  const entry = forecast.data.properties.timeseries.find(
    entry => Date.parse(entry.time) === hour,
  )
  if (!entry) return null
  const symbol =
    entry.data.next_1_hours?.summary.symbol_code ??
    entry.data.next_6_hours?.summary.symbol_code
  if (!symbol) return null

  return {
    temperature: Math.round(entry.data.instant.details.air_temperature),
    symbol,
    time: entry.time,
  }
}

export function describeWeather(symbol: string): {
  label: string
  icon:
    | "sun"
    | "moon"
    | "partlyCloudy"
    | "cloud"
    | "rain"
    | "snow"
    | "thunder"
    | "fog"
} {
  const base = symbol.split("_")[0]
  if (base.includes("thunder")) return { label: "Torden", icon: "thunder" }
  if (base.includes("sleet")) return { label: "Sludd", icon: "snow" }
  if (base.includes("snow")) return { label: "Snø", icon: "snow" }
  if (base.includes("rain")) return { label: "Regn", icon: "rain" }
  if (base === "fog") return { label: "Tåke", icon: "fog" }
  if (base === "clearsky")
    return {
      label: "Klarvær",
      icon: symbol.endsWith("_night") ? "moon" : "sun",
    }
  if (base === "fair" || base === "partlycloudy")
    return { label: "Lettskyet", icon: "partlyCloudy" }
  return { label: "Skyet", icon: "cloud" }
}

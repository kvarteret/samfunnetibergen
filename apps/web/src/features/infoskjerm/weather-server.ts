import "server-only"

import { parseScreenWeather, type ScreenWeather } from "./weather"

const BERGEN_FORECAST_URL =
  "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=60.3894&lon=5.3221"

export async function fetchScreenWeather(
  now: Date,
): Promise<ScreenWeather | null> {
  try {
    const response = await fetch(BERGEN_FORECAST_URL, {
      headers: {
        "User-Agent":
          "SamfunnetInfoskjerm/1.0 (https://www.samfunnetibergen.no)",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) return null
    return parseScreenWeather(await response.json(), now)
  } catch {
    return null
  }
}

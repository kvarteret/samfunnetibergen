import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react"
import { describeWeather, type ScreenWeather } from "./weather"

const weatherIcons = {
  sun: Sun,
  moon: Moon,
  partlyCloudy: CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  thunder: CloudLightning,
  fog: CloudFog,
}

export function WeatherDisplay({ weather }: { weather: ScreenWeather }) {
  const { label, icon } = describeWeather(weather.symbol)
  const Icon = weatherIcons[icon]

  return (
    <div className="mt-[1cqw]">
      <div
        className="flex items-center justify-end gap-[1cqw] text-[2cqw] leading-[1.3]"
        role="img"
        aria-label={`Værvarsel for Bergen: ${label}, ${weather.temperature} grader`}
      >
        <Icon aria-hidden className="size-[3cqw]" />
        <span>{weather.temperature}°</span>
        <span>{label}</span>
      </div>
    </div>
  )
}

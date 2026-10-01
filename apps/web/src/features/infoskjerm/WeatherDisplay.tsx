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
import styles from "./InfoScreen.module.css"
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
    <div className={styles.weather}>
      <div
        role="img"
        aria-label={`Værvarsel for Bergen: ${label}, ${weather.temperature} grader`}
      >
        <Icon aria-hidden />
        <span>{weather.temperature}°</span>
        <span>{label}</span>
      </div>
    </div>
  )
}

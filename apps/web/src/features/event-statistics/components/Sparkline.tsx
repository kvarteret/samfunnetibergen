import { SERIES_COLORS } from "./palette"

/**
 * A small area line of daily values. Pass `peak` to share one scale across
 * several sparklines; otherwise each uses its own maximum.
 */
export function Sparkline({
  values,
  peak,
  label,
  width = 112,
  height = 40,
}: {
  values: number[]
  peak?: number
  label: string
  width?: number
  height?: number
}) {
  if (values.length < 2) return null
  const top = Math.max(1, peak ?? Math.max(...values))
  const step = width / (values.length - 1)
  const points = values.map(
    (value, index) =>
      [index * step, height - 2 - (value / top) * (height - 4)] as const,
  )
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
  return (
    <svg
      aria-label={`Visninger per dag for ${label}`}
      className="shrink-0 overflow-visible"
      height={height}
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <polygon
        fill={SERIES_COLORS[0]}
        fillOpacity={0.14}
        points={`0,${height} ${line.join(" ")} ${width},${height}`}
      />
      <polyline
        fill="none"
        points={line.join(" ")}
        stroke={SERIES_COLORS[0]}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  )
}

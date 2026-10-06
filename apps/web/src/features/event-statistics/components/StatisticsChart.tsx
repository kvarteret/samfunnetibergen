"use client"

import { BarChart, LineChart } from "echarts/charts"
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components"
import * as echarts from "echarts/core"
import { SVGRenderer } from "echarts/renderers"
import { useEffect, useRef } from "react"

import { SERIES_COLORS } from "./palette"

export { SERIES_COLORS }

echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  SVGRenderer,
])

const ORANGE_DEEP = "#a8560a"
const INK = "#241d1b"
const MUTED_INK = "#6b625c"
/** Values that cannot exist yet, such as days still ahead. */
const PENDING_INK = "rgba(36, 29, 27, 0.32)"
const AXIS_LINE = "rgba(36, 29, 27, 0.18)"
const GRID_LINE = "rgba(36, 29, 27, 0.08)"

/** Figures use the site's mono face, like times on the infoskjerm. */
let monoFamily = "ui-monospace, monospace"

const dayFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})
const numberFormatter = new Intl.NumberFormat("nb-NO")

type ChartOption = echarts.EChartsCoreOption

/** `build` receives the container width so layout can adapt to phones. */
function useChart(build: (width: number) => ChartOption, label: string) {
  const ref = useRef<HTMLDivElement>(null)
  const buildRef = useRef(build)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const chart = echarts.init(element, null, { renderer: "svg" })
    const fontFamily = getComputedStyle(element).fontFamily
    const mono = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-dm-mono")
      .trim()
    if (mono) monoFamily = `${mono}, ui-monospace, monospace`
    const render = () =>
      chart.setOption({
        textStyle: { fontFamily, color: INK },
        aria: { enabled: true, label: { description: label } },
        animationDuration: 500,
        ...buildRef.current(element.clientWidth),
      })
    render()
    const observer = new ResizeObserver(() => {
      render()
      chart.resize()
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [label])
  return ref
}

const tooltipBase = {
  backgroundColor: "#fffdf8",
  borderWidth: 0,
  padding: [10, 14],
  textStyle: { color: INK, fontSize: 14 },
  // The tooltip is HTML, so it can follow the active site theme directly.
  extraCssText:
    "border-radius:var(--radius);box-shadow:var(--shadow-hard-lg-value);background:var(--popover);color:var(--popover-foreground);",
}

type DailySeries = {
  name: string
  values: number[]
}

export function DailyTrendChart({
  days,
  series,
  label,
}: {
  days: string[]
  series: DailySeries[]
  label: string
}) {
  const ref = useChart(
    () => ({
      color: [...SERIES_COLORS],
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      legend: {
        top: 0,
        left: 0,
        icon: "roundRect",
        itemWidth: 16,
        itemHeight: 6,
        itemGap: 20,
        textStyle: { color: MUTED_INK, fontSize: 14 },
      },
      tooltip: {
        ...tooltipBase,
        trigger: "axis",
        axisPointer: {
          type: "line",
          lineStyle: { color: AXIS_LINE, width: 1, type: "dashed" },
        },
        valueFormatter: (value: number) => numberFormatter.format(value),
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: days.map(day =>
          dayFormatter.format(new Date(`${day}T00:00:00Z`)),
        ),
        axisLine: { lineStyle: { color: AXIS_LINE, width: 1 } },
        axisTick: { show: false },
        axisLabel: {
          color: MUTED_INK,
          hideOverlap: true,
          margin: 14,
          fontSize: 12,
        },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: GRID_LINE, type: "dashed" } },
        axisLabel: {
          color: MUTED_INK,
          fontFamily: monoFamily,
          fontSize: 12,
          formatter: (value: number) => numberFormatter.format(value),
        },
      },
      series: series.map((entry, index) => ({
        name: entry.name,
        type: "line",
        data: entry.values,
        smooth: 0.3,
        symbol: "circle",
        symbolSize: 9,
        showSymbol: false,
        lineStyle: { width: index === 0 ? 3 : 2 },
        itemStyle: { borderColor: "#faf7f2", borderWidth: 2 },
        emphasis: { focus: "series" },
        areaStyle:
          index === 0
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "rgba(206, 113, 12, 0.24)" },
                  { offset: 1, color: "rgba(206, 113, 12, 0)" },
                ]),
              }
            : undefined,
      })),
    }),
    label,
  )
  return <div ref={ref} className="h-72 w-full" role="img" aria-label={label} />
}

export function TopListChart({
  items,
  label,
  valueName,
}: {
  /** `pending` items have not happened yet: dimmed and shown as "–". */
  items: Array<{ name: string; value: number; pending?: boolean }>
  label: string
  valueName: string
}) {
  const ordered = [...items].reverse()
  const ref = useChart(
    width => ({
      grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: "item",
        formatter: (params: {
          name: string
          value: number
          dataIndex: number
        }) =>
          `<strong>${escapeHtml(params.name)}</strong><br/>${valueName}: ${
            ordered[params.dataIndex]?.pending
              ? "ikke ennå"
              : numberFormatter.format(params.value)
          }`,
      },
      // Bars carry direct value labels, so the value axis stays out of the way.
      xAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: "category",
        data: ordered.map(item => item.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: INK,
          fontSize: 13,
          margin: 12,
          width: Math.min(180, Math.round(width * 0.38)),
          overflow: "truncate",
          formatter: (name: string, index: number) =>
            ordered[index]?.pending ? `{pending|${name}}` : name,
          rich: { pending: { color: PENDING_INK, fontSize: 13 } },
        },
      },
      series: [
        {
          name: valueName,
          type: "bar",
          data: ordered.map(item => item.value),
          barMaxWidth: 20,
          showBackground: true,
          backgroundStyle: {
            color: "rgba(206, 113, 12, 0.08)",
            borderRadius: 4,
          },
          itemStyle: { color: SERIES_COLORS[0], borderRadius: [0, 4, 4, 0] },
          emphasis: { itemStyle: { color: ORANGE_DEEP } },
          label: {
            show: true,
            position: "right",
            color: INK,
            fontFamily: monoFamily,
            fontSize: 12,
            formatter: (params: { value: number; dataIndex: number }) =>
              ordered[params.dataIndex]?.pending
                ? "{pending|–}"
                : numberFormatter.format(params.value),
            rich: { pending: { color: PENDING_INK, fontSize: 12 } },
          },
        },
      ],
    }),
    label,
  )
  return (
    <div
      ref={ref}
      className="w-full"
      role="img"
      aria-label={label}
      style={{ height: Math.max(160, items.length * 36 + 24) }}
    />
  )
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  )
}

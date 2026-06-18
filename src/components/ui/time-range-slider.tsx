"use client"

import { Slider } from "@base-ui/react/slider"
import { useCallback, useMemo } from "react"
import { minutesToTime } from "@/lib/opening-hours"

const MINUTES_IN_DAY = 24 * 60

// ---------------------------------------------------------------------------
// TimeRangeSlider — a Base UI range slider that lets the user pick a start
// and end time from a pre-computed set of 15‑minute slot marks (expressed as
// minutes from midnight of the start date).  Multi‑day events are supported:
// marks beyond 1440 represent the next calendar day(s).
// ---------------------------------------------------------------------------

interface TimeRangeSliderProps {
  /** Sorted minute marks (from midnight of start date). */
  marks: number[]
  /** Currently selected start time as HH:mm (e.g. "19:00") */
  startTime: string
  /** Currently selected end time as HH:mm */
  endTime: string
  /** Number of calendar days spanned by the event (≥ 1). */
  dayCount: number
  /** Multi-day: first selectable index in first day's marks (start min). */
  firstDayStartIdx?: number
  /** Multi-day: last selectable index in first day's marks (start max). */
  firstDayEndIdx?: number
  /** Multi-day: first selectable index in last day's marks (end min). */
  lastDayStartIdx?: number
  /** Multi-day: last selectable index in last day's marks (end max). */
  lastDayEndIdx?: number
  /** When true, the slider turns red to indicate a booking conflict. */
  conflict: boolean
  /** Minute ranges (relative to start date midnight) that are booked. */
  occupiedRanges: { startMin: number; endMin: number }[]
  /** Index range from end of first day to start of last day (stapled mid-section). */
  stapledSegments?: { startIdx: number; endIdx: number }[]
  /** Called with the new start time (HH:mm). */
  onStartChange: (value: string) => void
  /** Called with the new end time (HH:mm). */
  onEndChange: (value: string) => void
}

export function TimeRangeSlider({
  marks,
  startTime,
  endTime,
  dayCount,
  firstDayStartIdx,
  firstDayEndIdx,
  lastDayStartIdx,
  lastDayEndIdx,
  conflict,
  occupiedRanges,
  stapledSegments,
  onStartChange,
  onEndChange,
}: TimeRangeSliderProps) {
  // ── Index-based mapping ──────────────────────────────────────────────
  // The slider operates on indices into the (sorted) marks array.
  // This way discrete slot marks with gaps (e.g. a closed kitchen block
  // between 14:00–17:00) never produce invalid intermediate values.
  // ─────────────────────────────────────────────────────────────────────

  const maxIndex = Math.max(0, marks.length - 1)

  // Multi-day: constrain thumbs to their respective day/opening-hour boundaries
  const minStartIdx = firstDayStartIdx ?? 0
  const maxStartIdx = firstDayEndIdx ?? maxIndex
  const minEndIdx = lastDayStartIdx ?? 0
  const maxEndIdx = lastDayEndIdx ?? maxIndex

  const startIndex = useMemo(() => {
    if (!startTime) return minStartIdx
    // Search within first day's marks for multi-day
    const searchEnd = firstDayEndIdx != null ? firstDayEndIdx + 1 : marks.length
    const searchStart = firstDayStartIdx ?? 0
    const slice = marks.slice(searchStart, searchEnd)
    const idx = slice.findIndex(m => minutesToTime(m) === startTime)
    const clamped = idx >= 0 ? searchStart + idx : minStartIdx
    return Math.min(Math.max(clamped, minStartIdx), maxStartIdx)
  }, [
    marks,
    startTime,
    minStartIdx,
    maxStartIdx,
    firstDayStartIdx,
    firstDayEndIdx,
  ])

  const endIndex = useMemo(() => {
    if (!endTime) return maxEndIdx
    // Search within last day's marks for multi-day
    const searchStart = lastDayStartIdx ?? 0
    const searchEnd = lastDayEndIdx != null ? lastDayEndIdx + 1 : marks.length
    const slice = marks.slice(searchStart, searchEnd)
    const idx = slice.findIndex(m => minutesToTime(m) === endTime)
    const clamped = idx >= 0 ? searchStart + idx : maxEndIdx
    return Math.min(Math.max(clamped, minEndIdx), maxEndIdx)
  }, [marks, endTime, minEndIdx, maxEndIdx, lastDayStartIdx, lastDayEndIdx])

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleValueChange = useCallback(
    (value: readonly number[]) => {
      let [sIdx, eIdx] = value as [number, number]
      sIdx = Math.min(Math.max(sIdx, minStartIdx), maxStartIdx)
      eIdx = Math.min(Math.max(eIdx, minEndIdx), maxEndIdx)
      if (sIdx >= eIdx) {
        eIdx = Math.min(sIdx + 1, maxEndIdx)
        sIdx = Math.max(eIdx - 1, minStartIdx)
      }
      if (sIdx >= 0 && sIdx < marks.length) {
        onStartChange(minutesToTime(marks[sIdx]))
      }
      if (eIdx >= 0 && eIdx < marks.length) {
        onEndChange(minutesToTime(marks[eIdx]))
      }
    },
    [
      marks,
      minStartIdx,
      maxStartIdx,
      minEndIdx,
      maxEndIdx,
      onStartChange,
      onEndChange,
    ],
  )

  const handleValueCommit = useCallback(
    (value: readonly number[]) => {
      let [sIdx, eIdx] = value as [number, number]
      sIdx = Math.min(Math.max(sIdx, minStartIdx), maxStartIdx)
      eIdx = Math.min(Math.max(eIdx, minEndIdx), maxEndIdx)
      if (sIdx >= eIdx) {
        eIdx = Math.min(sIdx + 1, maxEndIdx)
        sIdx = Math.max(eIdx - 1, minStartIdx)
      }
      if (sIdx >= 0 && sIdx < marks.length) {
        onStartChange(minutesToTime(marks[sIdx]))
      }
      if (eIdx >= 0 && eIdx < marks.length) {
        onEndChange(minutesToTime(marks[eIdx]))
      }
    },
    [
      marks,
      minStartIdx,
      maxStartIdx,
      minEndIdx,
      maxEndIdx,
      onStartChange,
      onEndChange,
    ],
  )

  // ── Format helpers ───────────────────────────────────────────────────

  const formatLabel = useCallback(
    (index: number) => {
      const minute = marks[index] ?? 0
      const localMinute = minute % MINUTES_IN_DAY
      return minutesToTime(localMinute)
    },
    [marks],
  )

  const sliderValue: [number, number] = [startIndex, endIndex]

  // Colors: use theme tokens — primary by default, destructive on conflict
  const trackColor = conflict ? "var(--destructive)" : "var(--primary)"

  // ── Occupied stripe overlays ─────────────────────────────────────────
  // Convert occupied minute ranges to percentage positions on the track.
  const minMinute = marks[minStartIdx]
  const maxMinute = marks[maxIndex]
  const totalSpan = maxMinute - minMinute || 1

  // ── Duration badge ─────────────────────────────────────────────────
  const durationLabel = useMemo(() => {
    const dur = marks[endIndex] - marks[startIndex]
    if (dur <= 0) return ""

    if (dayCount > 1) {
      const d = Math.floor(dur / MINUTES_IN_DAY)
      const h = Math.floor((dur % MINUTES_IN_DAY) / 60)
      if (d === 0) return `${h}t`
      if (h === 0) return `${d}d`
      return `${d}d ${h}t`
    }

    const h = Math.floor(dur / 60)
    const m = dur % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}t`
    return `${h}t ${m}m`
  }, [marks, startIndex, endIndex, dayCount])

  // ── Tick marks ────────────────────────────────────────────────────
  // Multi-day: one tick per day. Single-day: every 2 hours.
  const tickMarks = useMemo(() => {
    const isMulti = dayCount > 1
    const raw: { index: number; minute: number; pct: number; label: string }[] =
      []

    if (isMulti) {
      // Per-day ticks: one at the start of each day's marks
      for (let d = 0; d < dayCount; d++) {
        const dayStart = d * MINUTES_IN_DAY
        const idx = marks.findIndex(
          m => m >= dayStart && m < dayStart + MINUTES_IN_DAY,
        )
        if (idx >= 0 && idx >= minStartIdx) {
          const pct = ((marks[idx] - minMinute) / totalSpan) * 100
          raw.push({
            index: idx,
            minute: marks[idx],
            pct,
            label: `Dag ${d + 1}`,
          })
        }
      }
    } else {
      // 2-hour ticks for single-day
      for (let i = 0; i < marks.length; i++) {
        const localMinute = marks[i] % MINUTES_IN_DAY
        if (localMinute % 120 === 0 && i >= minStartIdx) {
          const pct = ((marks[i] - minMinute) / totalSpan) * 100
          raw.push({ index: i, minute: marks[i], pct, label: formatLabel(i) })
        }
      }
    }

    return raw
  }, [marks, dayCount, minMinute, totalSpan, minStartIdx, formatLabel])

  const stripeSegments = useMemo(() => {
    if (!occupiedRanges.length) return []
    return occupiedRanges
      .map(r => ({
        start: Math.max(minMinute, r.startMin),
        end: Math.min(maxMinute, r.endMin),
      }))
      .filter(r => r.end > r.start)
      .map(r => {
        const left = ((r.start - minMinute) / totalSpan) * 100
        const width = ((r.end - r.start) / totalSpan) * 100
        return { left, width }
      })
      .filter(s => s.width > 0)
  }, [occupiedRanges, minMinute, maxMinute, totalSpan])

  // If there are fewer than 2 marks, we can't render a meaningful range.
  if (marks.length < 2) {
    return (
      <p className="text-sm text-foreground-muted">
        Ikke nok tidspunkt for å vise en tidsvelger.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {/* Current selection readout */}
      <div className="flex items-center gap-2 font-heading text-sm text-foreground">
        <span>
          {formatLabel(startIndex)} — {formatLabel(endIndex)}
        </span>
        {durationLabel && (
          <span className="tabular-nums text-foreground-muted">
            → {durationLabel}
          </span>
        )}
      </div>

      <Slider.Root
        max={maxIndex}
        min={minStartIdx}
        minStepsBetweenValues={1}
        onValueChange={handleValueChange}
        onValueCommitted={handleValueCommit}
        step={1}
        value={sliderValue}
      >
        <Slider.Control className="relative flex w-full touch-none items-center py-3 select-none">
          <Slider.Track className="relative h-1.5 w-full rounded-full bg-muted cursor-pointer">
            <Slider.Indicator
              className="rounded-full"
              style={{ backgroundColor: trackColor }}
            />

            {/* Tick marks on the track */}
            {tickMarks.map(tick => (
              <div
                key={tick.index}
                className="pointer-events-none absolute inset-y-0 w-px"
                style={{
                  left: `${tick.pct}%`,
                  background: "var(--foreground-muted)",
                  opacity: 0.5,
                }}
              />
            ))}

            {/* Occupied range stripe overlays */}
            {stripeSegments.map((seg, i) => (
              <div
                key={i}
                className="pointer-events-none absolute inset-y-0 rounded-full cursor-not-allowed z-20"
                style={{
                  left: `${seg.left}%`,
                  width: `${seg.width}%`,
                  background: `repeating-linear-gradient(-45deg, var(--destructive), var(--destructive) 2px, transparent 2px, transparent 6px)`,
                  opacity: 0.6,
                }}
              />
            ))}

            {/* Stapled overlays — non-selectable night gaps between days */}
            {(stapledSegments ?? []).map((seg, i) => {
              const left = ((marks[seg.startIdx] - minMinute) / totalSpan) * 100
              const width =
                ((marks[seg.endIdx] - marks[seg.startIdx] + 60) / totalSpan) *
                100
              return (
                <div
                  key={`staple-${i}`}
                  className="pointer-events-none absolute inset-y-0 cursor-not-allowed z-10"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: "var(--muted)",
                    backgroundImage: `repeating-linear-gradient(90deg, oklch(from var(--primary) calc(l * 0.9) c h) 0, oklch(from var(--primary) calc(l * 0.9) c h) 24px, transparent 24px, transparent 48px)`,
                  }}
                />
              )
            })}

            {/* Start thumb */}
            <Slider.Thumb
              aria-label="Starttid"
              className="size-5 cursor-pointer rounded-full border-2 bg-white shadow-sm transition-colors select-none"
              index={0}
              style={{ borderColor: trackColor }}
            />

            {/* End thumb */}
            <Slider.Thumb
              aria-label="Sluttid"
              className="size-5 cursor-pointer rounded-full border-2 bg-white shadow-sm transition-colors select-none"
              index={1}
              style={{ borderColor: trackColor }}
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      {/* Time labels under the track */}
      <div className="relative h-5">
        {tickMarks.map(tick => (
          <span
            key={tick.index}
            className="absolute top-0 -translate-x-1/2 text-xs text-foreground-muted tabular-nums"
            style={{ left: `${tick.pct}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  )
}

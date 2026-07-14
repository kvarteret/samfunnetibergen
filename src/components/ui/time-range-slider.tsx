"use client"

import { Popover } from "@base-ui/react/popover"
import { Slider } from "@base-ui/react/slider"
import { Info } from "lucide-react"
import { type ReactNode, useCallback, useMemo } from "react"
import { minutesToTime } from "@/lib/opening-hours"
import { TimeSlotBox, type TimeSlotBoxOption } from "./time-slot-box"

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
  /** The per-day doors-open config, rendered as its own block below the slider. */
  doorsSlot?: ReactNode
}

// A mark is unavailable if it falls inside any existing booking for the
// selected room(s) — used to color the get-in/get-out slot options.
function isMarkOccupied(
  minute: number,
  occupiedRanges: { startMin: number; endMin: number }[],
): boolean {
  return occupiedRanges.some(r => minute >= r.startMin && minute < r.endMin)
}

// Slot-box options for one thumb: every mark in [minIdx, maxIdx], labeled by
// local time-of-day and flagged unavailable when it falls in a booked range.
function buildSlotOptions(
  marks: number[],
  minIdx: number,
  maxIdx: number,
  occupiedRanges: { startMin: number; endMin: number }[],
): TimeSlotBoxOption[] {
  const options: TimeSlotBoxOption[] = []
  for (let i = minIdx; i <= maxIdx && i < marks.length; i++) {
    const label = minutesToTime(marks[i] % MINUTES_IN_DAY)
    options.push({
      value: label,
      label,
      availability: isMarkOccupied(marks[i], occupiedRanges)
        ? "unavailable"
        : "available",
    })
  }
  return options
}

/** Index of the first mark in [searchStart, searchEnd) whose local
 * time-of-day equals `time`, or -1 when none matches. */
export function timeIndexWithin(
  marks: number[],
  time: string,
  searchStart: number,
  searchEnd: number,
): number {
  for (
    let i = Math.max(0, searchStart);
    i < searchEnd && i < marks.length;
    i++
  ) {
    if (minutesToTime(marks[i] % MINUTES_IN_DAY) === time) return i
  }
  return -1
}

/** Compact Norwegian duration badge: "3t 30m" single-day, "2d 4t" multi-day. */
export function formatDurationLabel(
  durationMin: number,
  isMultiDay: boolean,
): string {
  if (durationMin <= 0) return ""

  if (isMultiDay) {
    const d = Math.floor(durationMin / MINUTES_IN_DAY)
    const h = Math.floor((durationMin % MINUTES_IN_DAY) / 60)
    if (d === 0) return `${h}t`
    if (h === 0) return `${d}d`
    return `${d}d ${h}t`
  }

  const h = Math.floor(durationMin / 60)
  const m = durationMin % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}t`
  return `${h}t ${m}m`
}

export interface TickMark {
  index: number
  minute: number
  pct: number
  label: string
}

/** Track ticks: one per day for multi-day, every 2 hours for single-day. */
export function computeTickMarks(
  marks: number[],
  dayCount: number,
  minStartIdx: number,
  minMinute: number,
  totalSpan: number,
): TickMark[] {
  const ticks: TickMark[] = []

  if (dayCount > 1) {
    // Per-day ticks: one at the start of each day's marks
    for (let d = 0; d < dayCount; d++) {
      const dayStart = d * MINUTES_IN_DAY
      const idx = marks.findIndex(
        m => m >= dayStart && m < dayStart + MINUTES_IN_DAY,
      )
      if (idx >= 0 && idx >= minStartIdx) {
        const pct = ((marks[idx] - minMinute) / totalSpan) * 100
        ticks.push({
          index: idx,
          minute: marks[idx],
          pct,
          label: `Dag ${d + 1}`,
        })
      }
    }
    return ticks
  }

  for (let i = 0; i < marks.length; i++) {
    const localMinute = marks[i] % MINUTES_IN_DAY
    if (localMinute % 120 === 0 && i >= minStartIdx) {
      const pct = ((marks[i] - minMinute) / totalSpan) * 100
      ticks.push({
        index: i,
        minute: marks[i],
        pct,
        label: minutesToTime(localMinute),
      })
    }
  }
  return ticks
}

/** Occupied minute ranges as percentage stripes on the visible track. */
export function occupiedStripeSegments(
  occupiedRanges: { startMin: number; endMin: number }[],
  minMinute: number,
  maxMinute: number,
  totalSpan: number,
): { left: number; width: number }[] {
  return occupiedRanges
    .map(r => ({
      start: Math.max(minMinute, r.startMin),
      end: Math.min(maxMinute, r.endMin),
    }))
    .filter(r => r.end > r.start)
    .map(r => ({
      left: ((r.start - minMinute) / totalSpan) * 100,
      width: ((r.end - r.start) / totalSpan) * 100,
    }))
    .filter(s => s.width > 0)
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
  doorsSlot,
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
    const idx = timeIndexWithin(marks, startTime, minStartIdx, searchEnd)
    const clamped = idx >= 0 ? idx : minStartIdx
    return Math.min(Math.max(clamped, minStartIdx), maxStartIdx)
  }, [marks, startTime, minStartIdx, maxStartIdx, firstDayEndIdx])

  const endIndex = useMemo(() => {
    if (!endTime) return maxEndIdx
    // Search within last day's marks for multi-day
    const searchEnd = lastDayEndIdx != null ? lastDayEndIdx + 1 : marks.length
    const idx = timeIndexWithin(marks, endTime, minEndIdx, searchEnd)
    const clamped = idx >= 0 ? idx : maxEndIdx
    return Math.min(Math.max(clamped, minEndIdx), maxEndIdx)
  }, [marks, endTime, minEndIdx, maxEndIdx, lastDayEndIdx])

  // ── Handlers ─────────────────────────────────────────────────────────

  // Minimum 1-hour gap between get-in and get-out, expressed in mark indices.
  // Single-day uses 15-min marks (4 steps = 60 min); multi-day uses 60-min
  // marks (1 step = 60 min). Derive from the actual marks array to be safe.
  const minGapIndices = useMemo(() => {
    if (marks.length < 2) return 1
    const step = marks[1] - marks[0]
    return step > 0 ? Math.max(1, Math.round(60 / step)) : 1
  }, [marks])

  const clampAndEmit = useCallback(
    (value: readonly number[]) => {
      let [sIdx, eIdx] = value as [number, number]
      sIdx = Math.min(Math.max(sIdx, minStartIdx), maxStartIdx)
      eIdx = Math.min(Math.max(eIdx, minEndIdx), maxEndIdx)

      // SHOVE: if gap < 1 hour, push the thumb that didn't move.
      if (eIdx - sIdx < minGapIndices) {
        const endMoved = eIdx !== endIndex
        if (endMoved) {
          // End moved toward start — shove start back.
          sIdx = Math.max(eIdx - minGapIndices, minStartIdx)
        } else {
          // Start moved toward end — shove end forward.
          eIdx = Math.min(sIdx + minGapIndices, maxEndIdx)
          sIdx = Math.max(eIdx - minGapIndices, minStartIdx)
        }
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
      minGapIndices,
      endIndex,
      onStartChange,
      onEndChange,
    ],
  )

  // Both onValueChange (drag) and onValueCommitted (release) write through
  // the same handler so slider thumbs and TimeSlotBoxes never disagree.
  const handleValueChange = clampAndEmit

  const handleValueCommit = clampAndEmit

  // ── Get-in / get-out box options ─────────────────────────────────────
  // Picking a slot from a box reuses the same commit handler as dragging the
  // slider, so both stay perfectly in sync and share the same clamping rules.

  const startOptions = useMemo(
    () => buildSlotOptions(marks, minStartIdx, maxStartIdx, occupiedRanges),
    [marks, minStartIdx, maxStartIdx, occupiedRanges],
  )

  const endOptions = useMemo(
    () => buildSlotOptions(marks, minEndIdx, maxEndIdx, occupiedRanges),
    [marks, minEndIdx, maxEndIdx, occupiedRanges],
  )

  const selectStart = useCallback(
    (timeValue: string) => {
      const idx = timeIndexWithin(
        marks,
        timeValue,
        minStartIdx,
        maxStartIdx + 1,
      )
      if (idx === -1) return
      handleValueCommit([idx, endIndex])
    },
    [marks, minStartIdx, maxStartIdx, endIndex, handleValueCommit],
  )

  const selectEnd = useCallback(
    (timeValue: string) => {
      const idx = timeIndexWithin(marks, timeValue, minEndIdx, maxEndIdx + 1)
      if (idx === -1) return
      handleValueCommit([startIndex, idx])
    },
    [marks, minEndIdx, maxEndIdx, startIndex, handleValueCommit],
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

  const durationLabel = useMemo(
    () =>
      formatDurationLabel(marks[endIndex] - marks[startIndex], dayCount > 1),
    [marks, startIndex, endIndex, dayCount],
  )

  const tickMarks = useMemo(
    () => computeTickMarks(marks, dayCount, minStartIdx, minMinute, totalSpan),
    [marks, dayCount, minStartIdx, minMinute, totalSpan],
  )

  const stripeSegments = useMemo(
    () =>
      occupiedStripeSegments(occupiedRanges, minMinute, maxMinute, totalSpan),
    [occupiedRanges, minMinute, maxMinute, totalSpan],
  )

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
      {/* relative z-20: lifts this row (and its portal-less info popover) above
          the slider, which is a later sibling and would otherwise paint over it. */}
      <div className="relative z-20 flex items-center gap-1.5">
        <p className="font-heading text-sm uppercase tracking-widest text-foreground">
          Get-in / get-out
        </p>
        <GetInGetOutInfo />
        {durationLabel && (
          <span className="font-heading text-sm tabular-nums text-foreground-muted">
            → {durationLabel}
          </span>
        )}
      </div>

      {/* Get-in and get-out frame the slider as its two posts: get-in sits at
          the left, get-out at the right, mirroring the labeled thumbs below.
          relative z-10 keeps their slot pickers above the slider below. */}
      <div className="relative z-10 flex items-end justify-between gap-3">
        <TimeSlotBox
          className="min-w-28"
          label="Get-in"
          onChange={selectStart}
          options={startOptions}
          value={formatLabel(startIndex)}
        />
        <TimeSlotBox
          className="min-w-28"
          label="Get-out"
          onChange={selectEnd}
          options={endOptions}
          value={formatLabel(endIndex)}
        />
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
              className="relative size-5 cursor-pointer rounded-full border-2 bg-white shadow-sm transition-colors select-none"
              index={0}
              style={{ borderColor: trackColor }}
            >
              <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-[10px] uppercase tracking-widest text-foreground-muted">
                Get-in
              </span>
            </Slider.Thumb>

            {/* End thumb */}
            <Slider.Thumb
              aria-label="Sluttid"
              className="relative size-5 cursor-pointer rounded-full border-2 bg-white shadow-sm transition-colors select-none"
              index={1}
              style={{ borderColor: trackColor }}
            >
              <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-[10px] uppercase tracking-widest text-foreground-muted">
                Get-out
              </span>
            </Slider.Thumb>
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

      {doorsSlot && (
        <div className="border-t border-border pt-4">{doorsSlot}</div>
      )}
    </div>
  )
}

// Explains get-in/get-out for arrangers — for multi-day bookings, get-in is
// the first day and get-out is the last day; days in between don't change
// these two times.
function GetInGetOutInfo() {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Hva betyr get-in og get-out?"
        className="flex size-5 cursor-pointer items-center justify-center text-foreground-muted transition-colors hover:text-foreground focus-brutal"
        closeDelay={100}
        delay={0}
        openOnHover
      >
        <Info aria-hidden className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="z-[100] w-72 space-y-2 panel shadow-shadow text-sm">
            <p>
              <strong className="font-heading">Get-in:</strong> som arrangør
              betyr det at leietaker kommer inn i rommet på avtalt tidspunkt og
              overtar ansvaret.
            </p>
            <p>
              <strong className="font-heading">Get-out:</strong> betyr at
              leietaker skal være helt ute av rommet igjen innen avtalt slutt,
              inkludert rydding og nedrigg.
            </p>
            <p className="text-foreground-muted">
              Er det flere dager er det get-in første dag og get-out siste dag
              som setter tidene for bookingen.
            </p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

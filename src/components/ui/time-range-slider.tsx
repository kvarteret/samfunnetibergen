"use client";

import { Slider } from "@base-ui/react/slider";
import { useCallback, useMemo } from "react";
import { minutesToTime } from "@/lib/opening-hours";

// ---------------------------------------------------------------------------
// TimeRangeSlider — a Base UI range slider that lets the user pick a start
// and end time from a pre-computed set of 30‑minute slot marks (expressed as
// minutes from midnight of the start date).  Multi‑day events are supported:
// marks beyond 1440 represent the next calendar day(s).
// ---------------------------------------------------------------------------

interface TimeRangeSliderProps {
  /** Sorted minute marks (from midnight of start date). */
  marks: number[];
  /** Currently selected start time as HH:mm (e.g. "19:00") */
  startTime: string;
  /** Currently selected end time as HH:mm */
  endTime: string;
  /** Number of calendar days spanned by the event (≥ 1). */
  dayCount: number;
  /** When true, the slider turns red to indicate a booking conflict. */
  conflict: boolean;
  /** Minute ranges (relative to start date midnight) that are booked. */
  occupiedRanges: { startMin: number; endMin: number }[];
  /** Called with the new start time (HH:mm). */
  onStartChange: (value: string) => void;
  /** Called with the new end time (HH:mm). */
  onEndChange: (value: string) => void;
}

export function TimeRangeSlider({
  marks,
  startTime,
  endTime,
  dayCount,
  conflict,
  occupiedRanges,
  onStartChange,
  onEndChange,
}: TimeRangeSliderProps) {
  // ── Index-based mapping ──────────────────────────────────────────────
  // The slider operates on indices into the (sorted) marks array.
  // This way discrete slot marks with gaps (e.g. a closed kitchen block
  // between 14:00–17:00) never produce invalid intermediate values.
  // ─────────────────────────────────────────────────────────────────────

  const maxIndex = Math.max(0, marks.length - 1);

  const startIndex = useMemo(() => {
    if (!startTime) return 0;
    // Quick lookup: find the mark that matches our current startTime
    const idx = marks.findIndex((m) => minutesToTime(m) === startTime);
    return idx >= 0 ? idx : 0;
  }, [marks, startTime]);

  const endIndex = useMemo(() => {
    if (!endTime) return maxIndex;
    // Search backwards: the same HH:mm can appear at different day offsets
    // (e.g. "02:00" at 02:00 vs. past-midnight 02:00+1).  The last
    // occurrence is the one anchored to the end of the date range.
    const idx = marks.findLastIndex((m) => minutesToTime(m) === endTime);
    return idx >= 0 ? idx : maxIndex;
  }, [marks, endTime, maxIndex]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleValueChange = useCallback(
    (value: readonly number[]) => {
      const [sIdx, eIdx] = value as [number, number];
      if (sIdx >= 0 && sIdx < marks.length) {
        onStartChange(minutesToTime(marks[sIdx]));
      }
      if (eIdx >= 0 && eIdx < marks.length) {
        onEndChange(minutesToTime(marks[eIdx]));
      }
    },
    [marks, onStartChange, onEndChange],
  );

  const handleValueCommit = useCallback(
    (value: readonly number[]) => {
      const [sIdx, eIdx] = value as [number, number];
      if (sIdx >= 0 && sIdx < marks.length) {
        onStartChange(minutesToTime(marks[sIdx]));
      }
      if (eIdx >= 0 && eIdx < marks.length) {
        onEndChange(minutesToTime(marks[eIdx]));
      }
    },
    [marks, onStartChange, onEndChange],
  );

  // ── Format helpers ───────────────────────────────────────────────────

  const formatLabel = useCallback(
    (index: number) => {
      const minute = marks[index] ?? 0;
      const dayOffset = Math.floor(minute / 1440);
      const localMinute = minute % 1440;
      const time = minutesToTime(localMinute);
      return dayCount > 1 && dayOffset > 0 ? `${time} +${dayOffset}` : time;
    },
    [marks, dayCount],
  );

  const sliderValue: [number, number] = [startIndex, endIndex];

  // Colors: use theme tokens — primary by default, destructive on conflict
  const trackColor = conflict ? "var(--destructive)" : "var(--primary)";

  // ── Occupied stripe overlays ─────────────────────────────────────────
  // Convert occupied minute ranges to percentage positions on the track.
  const minMinute = marks[0];
  const maxMinute = marks[maxIndex];
  const totalSpan = maxMinute - minMinute || 1;

  const stripeSegments = useMemo(() => {
    if (!occupiedRanges.length) return [];
    return occupiedRanges
      .map((r) => ({
        start: Math.max(minMinute, r.startMin),
        end: Math.min(maxMinute, r.endMin),
      }))
      .filter((r) => r.end > r.start)
      .map((r) => {
        const left = ((r.start - minMinute) / totalSpan) * 100;
        const width = ((r.end - r.start) / totalSpan) * 100;
        return { left, width };
      })
      .filter((s) => s.width > 0);
  }, [occupiedRanges, minMinute, maxMinute, totalSpan]);

  // If there are fewer than 2 marks, we can't render a meaningful range.
  if (marks.length < 2) {
    return (
      <p className="text-sm text-foreground-muted">
        Ikke nok tidspunkt for å vise en tidsvelger.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Current selection readout */}
      <div className="flex items-center justify-between font-heading text-sm text-foreground">
        <span>
          {formatLabel(startIndex)} — {formatLabel(endIndex)}
        </span>
      </div>

      <Slider.Root
        max={maxIndex}
        min={0}
        minStepsBetweenValues={1}
        onValueChange={handleValueChange}
        onValueCommitted={handleValueCommit}
        step={1}
        value={sliderValue}
      >
        <Slider.Control className="relative flex w-full touch-none items-center py-3 select-none">
          <Slider.Track className="relative h-1.5 w-full rounded-full bg-muted">
            <Slider.Indicator
              className="rounded-full"
              style={{ backgroundColor: trackColor }}
            />

            {/* Occupied range stripe overlays */}
            {stripeSegments.map((seg, i) => (
              <div
                key={i}
                className="pointer-events-none absolute inset-y-0 rounded-full"
                style={{
                  left: `${seg.left}%`,
                  width: `${seg.width}%`,
                  background: `repeating-linear-gradient(-45deg, var(--destructive), var(--destructive) 2px, transparent 2px, transparent 6px)`,
                  opacity: 0.5,
                }}
              />
            ))}

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
      <div className="flex justify-between text-xs text-foreground-muted tabular-nums">
        <span>{formatLabel(0)}</span>
        <span>{formatLabel(maxIndex)}</span>
      </div>
    </div>
  );
}

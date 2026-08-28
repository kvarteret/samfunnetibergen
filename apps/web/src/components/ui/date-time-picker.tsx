"use client"

import { addDays, differenceInCalendarDays, parseISO } from "date-fns"
import { useLocale, useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"
import type { DateRange } from "react-day-picker"
import { enUS, nb } from "react-day-picker/locale"
import { Button } from "@/components/ui/button"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { SelectField } from "@/components/ui/select-field"
import { TimeRangeSlider } from "@/components/ui/time-range-slider"
import {
  type ClosedDate,
  combineOpeningRangesForDate,
  hasOpeningHoursRows,
  isHouseClosed,
  minutesToTime,
  type OpeningHours,
  type VacationMode,
} from "@/lib/opening-hours"
import { timeToMinutes } from "@/lib/time"
import { cn } from "@/lib/utils"

const SLOT_STEP_MIN = 15
const MULTI_DAY_SLOT_STEP_MIN = 60
const MINUTES_IN_DAY = 24 * 60
const MAX_RANGE_DAYS = 7
// Multi-day bookings ride a full 24h hourly grid, so every day contributes
// exactly this many marks (0, 60, …, 1380). Day d's marks start at d * 24.
const SLOTS_PER_DAY = 24

function slotMarks(
  date: string,
  hours: OpeningHours | null,
  roomHours: OpeningHours | null,
  closed: ClosedDate[],
  vacationMode?: VacationMode | null,
  stepMin = SLOT_STEP_MIN,
): number[] {
  const marks = new Set<number>()
  for (const range of combineOpeningRangesForDate(
    date,
    hours,
    roomHours,
    closed,
    vacationMode,
  )) {
    for (let m = range.startMin; m <= range.endMin; m += stepMin) marks.add(m)
  }
  return Array.from(marks).toSorted((a, b) => a - b)
}

/** Latest closing minute (from its own midnight) across a day's combined
 * opening ranges; may exceed 1440 when the room closes after midnight.
 * 0 when the day has no opening hours (closed or unconfigured). */
function dayClosingMinute(
  date: string,
  openingHours: OpeningHours | null,
  roomOpeningHours: OpeningHours | null,
  closedDates: ClosedDate[],
  vacationMode?: VacationMode | null,
): number {
  const ranges = combineOpeningRangesForDate(
    date,
    openingHours,
    roomOpeningHours,
    closedDates,
    vacationMode,
  )
  return ranges.length === 0 ? 0 : Math.max(...ranges.map(r => r.endMin))
}

/**
 * Hourly mark grid for a multi-day booking: every spanned day contributes a
 * full 24h of marks, and — when the final day closes after midnight — the
 * trailing post-midnight hours are appended so get-out can reach the room's
 * real closing time. The uniform `value === index * 60` relationship holds
 * across the appended marks, which `computeMultiDayConstraints` relies on.
 */
export function multiDayMarks(
  startDate: string,
  dayCount: number,
  openingHours: OpeningHours | null,
  roomOpeningHours: OpeningHours | null,
  closedDates: ClosedDate[],
  vacationMode?: VacationMode | null,
): number[] {
  const marks = unconstrainedMarks(dayCount, MULTI_DAY_SLOT_STEP_MIN)

  const lastDate = toDateString(addDays(parseISO(startDate), dayCount - 1))
  const lastClose = dayClosingMinute(
    lastDate,
    openingHours,
    roomOpeningHours,
    closedDates,
    vacationMode,
  )
  if (lastClose <= MINUTES_IN_DAY) return marks

  const lastDayMidnight = (dayCount - 1) * MINUTES_IN_DAY
  for (let m = MINUTES_IN_DAY; m <= lastClose; m += MULTI_DAY_SLOT_STEP_MIN) {
    marks.push(lastDayMidnight + m)
  }
  return marks
}

export interface MultiDayConstraints {
  firstDayStartIdx?: number
  firstDayEndIdx?: number
  lastDayStartIdx?: number
  lastDayEndIdx?: number
  stapledSegments: { startIdx: number; endIdx: number }[]
}

/**
 * Multi-day bookings ride a full 24h hourly grid, but the get-in/get-out
 * thumbs must stay inside the first/last day's opening hours. Derive those
 * clamp indices — plus the inert "stapled" night gap between days — from each
 * spanned day's opening ranges. Days with no opening hours are skipped, so the
 * first/last entries are the first/last *open* days. Returns empty constraints
 * for single-day bookings (thumbs span the whole track).
 */
export function computeMultiDayConstraints(
  startDate: string,
  dayCount: number,
  openingHours: OpeningHours | null,
  roomOpeningHours: OpeningHours | null,
  closedDates: ClosedDate[],
  vacationMode?: VacationMode | null,
): MultiDayConstraints {
  if (dayCount <= 1) return { stapledSegments: [] }

  const dayIndices: { start: number; end: number }[] = []
  for (let d = 0; d < dayCount; d++) {
    const date = addDays(parseISO(startDate), d)
    const ranges = combineOpeningRangesForDate(
      toDateString(date),
      openingHours,
      roomOpeningHours,
      closedDates,
      vacationMode,
    )
    if (ranges.length === 0) continue
    const minStart = Math.min(...ranges.map(r => r.startMin))
    const maxEnd = Math.max(...ranges.map(r => r.endMin))
    const offset = d * SLOTS_PER_DAY
    // Get-in always stays within its own calendar day (clamped to 23:00). The
    // final day's get-out may extend past midnight to the room's real close —
    // those trailing marks are appended by multiDayMarks, so the index runs
    // into the next day's offset rather than clamping.
    const isLastDay = d === dayCount - 1
    const endHour =
      isLastDay && maxEnd > MINUTES_IN_DAY
        ? Math.floor(maxEnd / 60)
        : Math.min(Math.floor(maxEnd / 60), SLOTS_PER_DAY - 1)
    dayIndices.push({
      start: offset + Math.ceil(minStart / 60),
      end: offset + endHour,
    })
  }

  if (dayIndices.length === 0) return { stapledSegments: [] }

  const first = dayIndices[0]
  const last = dayIndices[dayIndices.length - 1]

  // Span between first day's get-out and last day's get-in: intermediate days
  // are part of the booking but not selectable for start/end.
  const stapledSegments: { startIdx: number; endIdx: number }[] = []
  if (dayIndices.length > 1 && first.end + 1 <= last.start - 1) {
    stapledSegments.push({ startIdx: first.end + 1, endIdx: last.start - 1 })
  }

  return {
    firstDayStartIdx: first.start,
    firstDayEndIdx: first.end,
    lastDayStartIdx: last.start,
    lastDayEndIdx: last.end,
    stapledSegments,
  }
}

// Deliberately local-time, not the Oslo helpers: it formats dates the user
// picked in the calendar widget, which live in the browser's timezone.
function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

interface DateTimePickerProps {
  startDate: string
  endDate: string
  today: string
  startTime: string
  endTime: string
  occupiedRanges: { startMin: number; endMin: number }[]
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  openingHours: OpeningHours | null
  roomOpeningHours: OpeningHours | null
  closedDates: ClosedDate[]
  vacationMode?: VacationMode | null
  timingWarning?: ReactNode
}

export function DateTimePicker({
  startDate,
  endDate,
  today,
  startTime,
  endTime,
  occupiedRanges,
  onStartDateChange,
  onEndDateChange,
  onStartChange,
  onEndChange,
  openingHours,
  roomOpeningHours,
  closedDates,
  vacationMode,
  timingWarning,
}: DateTimePickerProps) {
  const locale = useLocale()
  const t = useTranslations("RoomBooking")
  const calendarLocale = locale === "en" ? enUS : nb
  const todayDate = new Date(`${today}T00:00:00`)

  const closedDateSet = new Set(closedDates.map(d => d.date))
  const hasHours =
    hasOpeningHoursRows(openingHours) || hasOpeningHoursRows(roomOpeningHours)

  const selectedRange: DateRange = {
    from: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
    to: endDate ? new Date(`${endDate}T00:00:00`) : undefined,
  }

  // Derived phase: if we have a start but no end, we're waiting for the end click
  const isSelectingEnd = Boolean(startDate && !endDate)

  const isOccupied = (d: Date): boolean => {
    if (d < todayDate) return false
    const ds = toDateString(d)
    if (closedDateSet.has(ds) || isHouseClosed(ds, [], vacationMode))
      return true
    if (!hasHours) return false
    return (
      slotMarks(ds, openingHours, roomOpeningHours, closedDates, vacationMode)
        .length === 0
    )
  }

  const isDisabled = (d: Date): boolean => {
    if (d < todayDate) return true
    if (isOccupied(d)) return true
    return false
  }

  // Dates beyond the 7-day window are dimmed but stay clickable (they reset
  // the range to a fresh start). Only applies while selecting an end date.
  const isBeyondRange = (d: Date): boolean => {
    if (!isSelectingEnd || !selectedRange.from) return false
    const maxEnd = new Date(selectedRange.from)
    maxEnd.setDate(maxEnd.getDate() + MAX_RANGE_DAYS - 1)
    return d > maxEnd
  }

  const handleDayClick = (date: Date, disabled: boolean) => {
    if (disabled) return
    if (isSelectingEnd && selectedRange.from) {
      if (date < selectedRange.from || isBeyondRange(date)) {
        // Clicked before start or outside max range → treat as new start
        onStartDateChange(toDateString(date))
        onEndDateChange("")
        return
      }
      onEndDateChange(toDateString(date))
    } else {
      onStartDateChange(toDateString(date))
      onEndDateChange("")
    }
  }

  return (
    <div className="space-y-6">
      <Calendar
        className="w-full p-0"
        classNames={{
          months: "relative w-full flex flex-col sm:flex-row gap-6",
          month: "flex-1 min-w-0 flex flex-col gap-4",
          nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between",
          button_previous:
            "size-8 flex items-center justify-center border border-border hover:bg-muted transition-colors select-none aria-disabled:opacity-50",
          button_next:
            "size-8 flex items-center justify-center border border-border hover:bg-muted transition-colors select-none aria-disabled:opacity-50",
          month_caption:
            "flex h-12 w-full items-center justify-center px-10 mb-2",
          caption_label:
            "font-heading text-sm font-semibold uppercase tracking-widest text-foreground select-none",
          weekdays: "flex border-b border-border pb-2 mb-1",
          weekday:
            "flex-1 text-center text-xs font-semibold uppercase tracking-wider text-foreground-muted select-none py-1",
          week: "flex w-full",
          day: "group/day relative flex-1 p-0 text-center select-none [&:first-child[data-selected=true]_button]:rounded-l [&:last-child[data-selected=true]_button]:rounded-r",
          today: "bg-muted/60 data-[selected=true]:bg-transparent",
          disabled: "opacity-25",
          hidden: "invisible",
          range_start:
            "relative isolate z-0 rounded-l bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
          range_middle: "rounded-none",
          range_end:
            "relative isolate z-0 rounded-r bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
        }}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          DayButton: ({ modifiers, day, onClick: _onClick, ...props }) => {
            const mods = modifiers as Record<string, boolean>
            return (
              <CalendarDayButton
                className={cn(
                  "aspect-auto h-11 w-full rounded-none text-sm font-normal hover:bg-muted/80 hover:rounded",
                  mods.occupied &&
                    "line-through text-destructive/70 !opacity-70",
                  mods.beyond_range && "opacity-40",
                )}
                day={day}
                locale={calendarLocale}
                modifiers={modifiers}
                onClick={() => handleDayClick(day.date, Boolean(mods.disabled))}
                variant="plain"
                {...props}
                style={
                  mods.range_middle
                    ? ({
                        backgroundColor: "var(--muted)",
                        backgroundImage:
                          "repeating-linear-gradient(90deg, oklch(from var(--primary) calc(l * 0.9) c h) 0, oklch(from var(--primary) calc(l * 0.9) c h) 24px, transparent 24px, transparent 48px)",
                      } as React.CSSProperties)
                    : undefined
                }
              />
            )
          },
        }}
        disabled={isDisabled}
        locale={calendarLocale}
        mode="range"
        modifiers={{ occupied: isOccupied, beyond_range: isBeyondRange }}
        modifiersClassNames={{ beyond_range: "opacity-40" }}
        numberOfMonths={2}
        onSelect={() => {}}
        selected={selectedRange}
        showOutsideDays={false}
        startMonth={todayDate}
      />

      <div className="border-t border-border pt-6">
        {startDate ? (
          isHouseClosed(startDate, closedDates, vacationMode) ? (
            <p className="text-sm text-foreground-muted">
              {t("dateTime.houseClosed")}
            </p>
          ) : (
            <TimeSlots
              startDate={startDate}
              endDate={endDate}
              occupiedRanges={occupiedRanges}
              openingHours={openingHours}
              roomOpeningHours={roomOpeningHours}
              closedDates={closedDates}
              vacationMode={vacationMode}
              startTime={startTime}
              endTime={endTime}
              onStartChange={onStartChange}
              onEndChange={onEndChange}
              timingWarning={timingWarning}
            />
          )
        ) : (
          <p className="text-sm text-foreground-muted">
            {t("dateTime.selectDate")}
          </p>
        )}
      </div>
    </div>
  )
}

interface TimeSlotsProps {
  startDate: string
  endDate: string
  occupiedRanges: { startMin: number; endMin: number }[]
  openingHours: OpeningHours | null
  roomOpeningHours: OpeningHours | null
  closedDates: ClosedDate[]
  vacationMode?: VacationMode | null
  startTime: string
  endTime: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  timingWarning?: ReactNode
}

/** First/last-day thumb clamps for a booking with no configured opening
 * hours: full day boundaries suffice. */
function unconstrainedConstraints(
  marks: number[],
  dayCount: number,
): MultiDayConstraints {
  if (dayCount <= 1) return { stapledSegments: [] }
  return {
    firstDayEndIdx: marks.reduce(
      (last, m, i) => (m < MINUTES_IN_DAY ? i : last),
      -1,
    ),
    lastDayStartIdx: marks.findIndex(m => m >= (dayCount - 1) * MINUTES_IN_DAY),
    stapledSegments: [],
  }
}

function TimeSlots({
  startDate,
  endDate,
  occupiedRanges,
  openingHours,
  roomOpeningHours,
  closedDates,
  vacationMode,
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  timingWarning,
}: TimeSlotsProps) {
  const t = useTranslations("RoomBooking")
  const hasHours =
    hasOpeningHoursRows(openingHours) || hasOpeningHoursRows(roomOpeningHours)

  const dayCount = endDate
    ? differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1
    : 1

  // Multi-day rides an hourly grid (extended past midnight on the final day to
  // its real close); single-day uses the day's actual slots.
  const openingMarks = endDate
    ? multiDayMarks(
        startDate,
        dayCount,
        openingHours,
        roomOpeningHours,
        closedDates,
        vacationMode,
      )
    : slotMarks(
        startDate,
        openingHours,
        roomOpeningHours,
        closedDates,
        vacationMode,
      )

  if (openingMarks.length < 2 && hasHours) {
    return (
      <p className="text-sm text-foreground-muted">
        {t("dateTime.noAvailableTimes")}
      </p>
    )
  }

  // No configured opening hours: ride a full-day grid instead, with the
  // thumbs clamped to the first/last day boundaries.
  const isUnconstrained = openingMarks.length < 2
  const marks = isUnconstrained
    ? unconstrainedMarks(
        dayCount,
        dayCount > 1 ? MULTI_DAY_SLOT_STEP_MIN : SLOT_STEP_MIN,
      )
    : openingMarks
  const constraints = isUnconstrained
    ? unconstrainedConstraints(marks, dayCount)
    : computeMultiDayConstraints(
        startDate,
        dayCount,
        openingHours,
        roomOpeningHours,
        closedDates,
        vacationMode,
      )

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <TimeRangeSlider
          marks={marks}
          startTime={startTime}
          endTime={endTime}
          dayCount={dayCount}
          firstDayStartIdx={constraints.firstDayStartIdx}
          firstDayEndIdx={constraints.firstDayEndIdx}
          lastDayStartIdx={constraints.lastDayStartIdx}
          lastDayEndIdx={constraints.lastDayEndIdx}
          occupiedRanges={occupiedRanges}
          stapledSegments={constraints.stapledSegments}
          timingWarning={timingWarning}
          onStartChange={onStartChange}
          onEndChange={onEndChange}
        />
      </div>
    </div>
  )
}

/** Flat marks for a 24h day. Step defaults to 15-min, 60-min for multi-day. */
export function unconstrainedMarks(
  dayCount: number,
  stepMin = SLOT_STEP_MIN,
): number[] {
  const marks: number[] = []
  for (let d = 0; d < dayCount; d++) {
    const offset = d * MINUTES_IN_DAY
    for (let m = 0; m < MINUTES_IN_DAY; m += stepMin) {
      marks.push(m + offset)
    }
  }
  // Single-day only: drop the very last mark so it can't be selected as a
  // start time with no remaining slots for end. For multi-day bookings this
  // mark is the last day's final slot (e.g. 23:00), which is a valid get-out
  // time and is matched by index math (e.g. lastDayEndIdx) that assumes every
  // day — including the last — has a full grid of marks.
  return dayCount > 1 ? marks : marks.slice(0, -1)
}

// Returns time options for a given day, constrained to the booking window:
// times must be >= booking start (day 0) and <= booking end (last day).
export function timeOptionsForDay(
  marks: number[],
  dayIndex: number,
  dayCount: number,
  localStartMinute: number | null,
  localEndMinute: number | null,
): { value: string; label: string }[] {
  const dayStart = dayIndex * MINUTES_IN_DAY
  const isFirstDay = dayIndex === 0
  const isLastDay = dayIndex === dayCount - 1
  const crossesMidnight =
    dayCount === 1 &&
    localStartMinute !== null &&
    localEndMinute !== null &&
    localEndMinute <= localStartMinute
  return marks
    .filter(m => {
      if (crossesMidnight) {
        return m >= localStartMinute && m <= localEndMinute + MINUTES_IN_DAY
      }
      if (m < dayStart || m >= dayStart + MINUTES_IN_DAY) return false
      const local = m % MINUTES_IN_DAY
      if (isFirstDay && localStartMinute !== null && local < localStartMinute)
        return false
      if (isLastDay && localEndMinute !== null && local > localEndMinute)
        return false
      return true
    })
    .map(m => {
      const label = minutesToTime(m % MINUTES_IN_DAY)
      return { value: label, label }
    })
}

interface BookingEventTimesProps {
  uid: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  doorsTimeError?: string
  doorsTimeId: string
  doorsTimes: string[]
  estimatedEndTimes: string[]
  openingHours: OpeningHours | null
  roomOpeningHours: OpeningHours | null
  closedDates: ClosedDate[]
  vacationMode?: VacationMode | null
  onDoorsChange: (dayIndex: number, value: string) => void
  onEstimatedEndChange: (dayIndex: number, value: string) => void
}

/** Per-day event timings shown with the arrangement details after the room
 * and booking window are valid. Uses the same opening-hour marks as the
 * get-in/get-out picker, and omits selects that have no valid options. */
export function BookingEventTimes({
  uid,
  startDate,
  endDate,
  startTime,
  endTime,
  doorsTimeError,
  doorsTimeId,
  doorsTimes,
  estimatedEndTimes,
  openingHours,
  roomOpeningHours,
  closedDates,
  vacationMode,
  onDoorsChange,
  onEstimatedEndChange,
}: BookingEventTimesProps) {
  const t = useTranslations("RoomBooking")
  if (!startDate || !startTime || !endTime) return null

  const dayCount = endDate
    ? differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1
    : 1
  const openingMarks = endDate
    ? multiDayMarks(
        startDate,
        dayCount,
        openingHours,
        roomOpeningHours,
        closedDates,
        vacationMode,
      )
    : slotMarks(
        startDate,
        openingHours,
        roomOpeningHours,
        closedDates,
        vacationMode,
      )
  const hasHours =
    hasOpeningHoursRows(openingHours) || hasOpeningHoursRows(roomOpeningHours)

  if (openingMarks.length < 2 && hasHours) return null

  const marks =
    openingMarks.length < 2
      ? unconstrainedMarks(
          dayCount,
          dayCount > 1 ? MULTI_DAY_SLOT_STEP_MIN : SLOT_STEP_MIN,
        )
      : openingMarks

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <PerDayTimeSelects
        uid={uid}
        idPrefix="doorsTime"
        heading={t("dateTime.doorsOpen")}
        headingNote={t("dateTime.day1Required")}
        singleDayLabel={t("dateTime.doorsOpenSingle")}
        firstDayError={doorsTimeError}
        firstDayHint={t("dateTime.doorsHint")}
        firstDayId={doorsTimeId}
        requiredFirstDay
        marks={marks}
        dayCount={dayCount}
        startTime={startTime}
        endTime={endTime}
        values={doorsTimes}
        onChange={onDoorsChange}
      />
      <PerDayTimeSelects
        uid={uid}
        idPrefix="estimatedEnd"
        heading={t("dateTime.estimatedEnd")}
        headingNote={t("dateTime.optional")}
        singleDayLabel={t("dateTime.estimatedEndSingle")}
        marks={marks}
        dayCount={dayCount}
        startTime={startTime}
        endTime={endTime}
        values={estimatedEndTimes}
        onChange={onEstimatedEndChange}
      />
    </div>
  )
}

interface PerDayTimeSelectsProps {
  uid: string
  idPrefix: string
  heading: string
  headingNote: string
  singleDayLabel: string
  requiredFirstDay?: boolean
  firstDayError?: string
  firstDayHint?: string
  firstDayId?: string
  marks: number[]
  dayCount: number
  startTime: string
  endTime: string
  values: string[]
  onChange: (dayIndex: number, value: string) => void
}

// One time dropdown per booked day ("Dørene åpner" / "Antatt slutt"), sent to
// Crescat as 0-minute timeline entries. Days are revealed one at a time via
// "Legg til dag N"; the caller keys this component by dayCount so a changed
// booking span resets the reveal. Options are constrained to the booking
// window (>= startTime on day 0, <= endTime on the last day).
function PerDayTimeSelects({
  uid,
  idPrefix,
  heading,
  headingNote,
  singleDayLabel,
  requiredFirstDay = false,
  firstDayError,
  firstDayHint,
  firstDayId,
  marks,
  dayCount,
  startTime,
  endTime,
  values,
  onChange,
}: PerDayTimeSelectsProps) {
  const t = useTranslations("RoomBooking")
  const localStartMinute = timeToMinutes(startTime)
  const localEndMinute = timeToMinutes(endTime)
  const filledDayCount = values.reduce(
    (max, value, i) => (value ? i + 1 : max),
    0,
  )
  const [visibleDayCount, setVisibleDayCount] = useState(() =>
    Math.max(1, filledDayCount),
  )

  const shownDayCount = Math.min(visibleDayCount, dayCount)
  const addNextDay = () =>
    setVisibleDayCount(count => Math.min(count + 1, dayCount))

  // Single day: one plain dropdown, no section chrome needed.
  if (dayCount === 1) {
    const options = timeOptionsForDay(
      marks,
      0,
      1,
      localStartMinute,
      localEndMinute,
    )
    if (options.length === 0) return null

    return (
      <div className="max-w-xs">
        <SelectField
          error={firstDayError}
          errorId={firstDayError ? `${firstDayId}-error` : undefined}
          hint={firstDayHint}
          id={firstDayId ?? `${uid}-${idPrefix}-0`}
          label={singleDayLabel}
          onChange={value => onChange(0, value)}
          options={options}
          placeholder={t("dateTime.selectTime")}
          value={values[0] ?? ""}
        />
      </div>
    )
  }

  const shownDays = Array.from({ length: shownDayCount }, (_, dayIndex) => ({
    dayIndex,
    options: timeOptionsForDay(
      marks,
      dayIndex,
      dayCount,
      localStartMinute,
      localEndMinute,
    ),
  })).filter(day => day.options.length > 0)

  return (
    <div className="space-y-3">
      <p className="font-heading text-sm uppercase tracking-widest text-foreground">
        {heading}{" "}
        <span className="normal-case tracking-normal text-foreground-muted">
          ({headingNote})
        </span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {shownDays.map(({ dayIndex, options }) => {
          const isFirstDay = dayIndex === 0
          return (
            <SelectField
              error={isFirstDay ? firstDayError : undefined}
              errorId={
                isFirstDay && firstDayError ? `${firstDayId}-error` : undefined
              }
              hint={isFirstDay ? firstDayHint : undefined}
              id={
                isFirstDay && firstDayId
                  ? firstDayId
                  : `${uid}-${idPrefix}-${dayIndex}`
              }
              key={dayIndex}
              label={`${t("dateTime.day", { number: dayIndex + 1 })}${requiredFirstDay && isFirstDay ? " *" : ""}`}
              onChange={value => onChange(dayIndex, value)}
              options={options}
              placeholder={t("dateTime.selectTime")}
              value={values[dayIndex] ?? ""}
            />
          )
        })}
      </div>

      {shownDayCount < dayCount && (
        <Button onClick={addNextDay} size="sm" type="button" variant="neutral">
          {t("dateTime.addDay", { number: shownDayCount + 1 })}
        </Button>
      )}
    </div>
  )
}

"use client"

import type { DateRange } from "react-day-picker"
import { nb } from "react-day-picker/locale"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { SelectField } from "@/components/ui/select-field"
import {
  type ClosedDate,
  combineOpeningRangesForDate,
  hasOpeningHoursRows,
  isHouseClosed,
  minutesToTime,
  type OpeningHours,
} from "@/lib/opening-hours"
import { cn } from "@/lib/utils"

const SLOT_STEP_MIN = 30
const MINUTES_IN_DAY = 24 * 60
const MAX_RANGE_DAYS = 7

interface TimeOption {
  value: string
  label: string
  min: number
}

function slotMarks(
  date: string,
  hours: OpeningHours | null,
  roomHours: OpeningHours | null,
  closed: ClosedDate[],
): number[] {
  const marks = new Set<number>()
  for (const range of combineOpeningRangesForDate(
    date,
    hours,
    roomHours,
    closed,
  )) {
    for (let m = range.startMin; m <= range.endMin; m += SLOT_STEP_MIN)
      marks.add(m)
  }
  return Array.from(marks).toSorted((a, b) => a - b)
}

const toOption = (min: number): TimeOption => ({
  value: minutesToTime(min),
  label: minutesToTime(min),
  min,
})

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

interface DateTimePickerProps {
  uid: string
  startDate: string
  endDate: string
  today: string
  startTime: string
  endTime: string
  doorsTime: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  onDoorsChange: (value: string) => void
  openingHours: OpeningHours | null
  roomOpeningHours: OpeningHours | null
  closedDates: ClosedDate[]
}

export function DateTimePicker({
  uid,
  startDate,
  endDate,
  today,
  startTime,
  endTime,
  doorsTime,
  onStartDateChange,
  onEndDateChange,
  onStartChange,
  onEndChange,
  onDoorsChange,
  openingHours,
  roomOpeningHours,
  closedDates,
}: DateTimePickerProps) {
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
    if (closedDateSet.has(ds)) return true
    if (!hasHours) return false
    return (
      slotMarks(ds, openingHours, roomOpeningHours, closedDates).length === 0
    )
  }

  const isDisabled = (d: Date): boolean => {
    if (d < todayDate) return true
    if (isOccupied(d)) return true
    if (isSelectingEnd && selectedRange.from) {
      const maxEnd = new Date(selectedRange.from)
      maxEnd.setDate(maxEnd.getDate() + MAX_RANGE_DAYS - 1)
      if (d > maxEnd) return true
    }
    return false
  }

  const handleDayClick = (date: Date, disabled: boolean) => {
    if (disabled) return
    if (isSelectingEnd && selectedRange.from) {
      if (date < selectedRange.from) {
        // Clicked before start → treat as new start
        onStartDateChange(toDateString(date))
        onEndDateChange("")
        return
      }
      const maxEnd = new Date(selectedRange.from)
      maxEnd.setDate(maxEnd.getDate() + MAX_RANGE_DAYS - 1)
      onEndDateChange(toDateString(date > maxEnd ? maxEnd : date))
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
          DayButton: ({
            className: _cls,
            modifiers,
            day,
            onClick: _dayPickerClick,
            ...props
          }) => (
            <CalendarDayButton
              className={cn(
                "aspect-auto h-11 w-full rounded-none text-sm font-normal hover:bg-muted/80 hover:rounded",
                (modifiers as Record<string, boolean>).occupied &&
                  "line-through text-destructive/70 !opacity-70",
              )}
              day={day}
              locale={nb}
              modifiers={modifiers}
              onClick={() =>
                handleDayClick(
                  day.date,
                  Boolean((modifiers as Record<string, boolean>).disabled),
                )
              }
              variant="plain"
              {...props}
            />
          ),
        }}
        disabled={isDisabled}
        locale={nb}
        mode="range"
        modifiers={{ occupied: isOccupied }}
        numberOfMonths={2}
        onSelect={() => {}}
        selected={selectedRange}
        showOutsideDays={false}
        startMonth={todayDate}
      />

      <div className="border-t border-border pt-6">
        {startDate ? (
          isHouseClosed(startDate, closedDates) ? (
            <p className="text-sm text-foreground-muted">
              Huset er stengt denne dagen. Velg en annen dato.
            </p>
          ) : (
            <TimeSlots
              uid={uid}
              date={startDate}
              openingHours={openingHours}
              roomOpeningHours={roomOpeningHours}
              closedDates={closedDates}
              startTime={startTime}
              endTime={endTime}
              doorsTime={doorsTime}
              onStartChange={onStartChange}
              onEndChange={onEndChange}
              onDoorsChange={onDoorsChange}
            />
          )
        ) : (
          <p className="text-sm text-foreground-muted">
            Velg en dato for å se ledige tidspunkt.
          </p>
        )}
      </div>
    </div>
  )
}

interface TimeSlotsProps {
  uid: string
  date: string
  openingHours: OpeningHours | null
  roomOpeningHours: OpeningHours | null
  closedDates: ClosedDate[]
  startTime: string
  endTime: string
  doorsTime: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  onDoorsChange: (value: string) => void
}

function TimeSlots({
  uid,
  date,
  openingHours,
  roomOpeningHours,
  closedDates,
  startTime,
  endTime,
  doorsTime,
  onStartChange,
  onEndChange,
  onDoorsChange,
}: TimeSlotsProps) {
  const marks = slotMarks(date, openingHours, roomOpeningHours, closedDates)

  if (marks.length === 0) {
    return (
      <UnconstrainedTimes
        uid={uid}
        startTime={startTime}
        endTime={endTime}
        doorsTime={doorsTime}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        onDoorsChange={onDoorsChange}
      />
    )
  }

  const options = marks.map(toOption)
  const startMin =
    options.find(option => option.value === startTime)?.min ?? marks[0]
  const startOptions = options
    .filter(option => option.min < MINUTES_IN_DAY)
    .slice(0, -1)
  const endOptions = options.filter(option => option.min > startMin)
  const doorsOptions = options.filter(option => option.min <= startMin)

  return (
    <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
      <SelectField
        id={`${uid}-doorsTime`}
        label="Dørene åpner"
        onChange={onDoorsChange}
        options={doorsOptions}
        placeholder="Ikke relevant"
        value={doorsTime}
      />
      <SelectField
        id={`${uid}-startTime`}
        label="Starter *"
        onChange={onStartChange}
        options={startOptions}
        placeholder="Velg"
        value={startTime}
      />
      <SelectField
        id={`${uid}-endTime`}
        label="Slutter *"
        onChange={onEndChange}
        options={endOptions}
        placeholder="Velg"
        value={endTime}
      />
    </div>
  )
}

const FALLBACK_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0")
  const m = i % 2 === 0 ? "00" : "30"
  return { value: `${h}:${m}`, label: `${h}:${m}` }
})

interface UnconstrainedTimesProps {
  uid: string
  startTime: string
  endTime: string
  doorsTime: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  onDoorsChange: (value: string) => void
}

function UnconstrainedTimes({
  uid,
  startTime,
  endTime,
  doorsTime,
  onStartChange,
  onEndChange,
  onDoorsChange,
}: UnconstrainedTimesProps) {
  return (
    <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
      <SelectField
        id={`${uid}-doorsTime`}
        label="Dørene åpner"
        onChange={onDoorsChange}
        options={FALLBACK_OPTIONS}
        placeholder="Ikke relevant"
        value={doorsTime}
      />
      <SelectField
        id={`${uid}-startTime`}
        label="Starter *"
        onChange={onStartChange}
        options={FALLBACK_OPTIONS}
        value={startTime}
      />
      <SelectField
        id={`${uid}-endTime`}
        label="Slutter *"
        onChange={onEndChange}
        options={FALLBACK_OPTIONS}
        value={endTime}
      />
    </div>
  )
}

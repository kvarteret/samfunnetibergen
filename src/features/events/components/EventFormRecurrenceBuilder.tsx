"use client"

import { useState } from "react"
import { RRule } from "rrule"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { ToggleGroup } from "@/components/ui/toggle-group"
import {
  buildRecurrence,
  initialRecurrenceInput,
  type RecurrenceEndType,
  type RecurrenceFrequency,
  type RecurrenceInput,
} from "../domain/recurrence"

type WeekdayOption = {
  label: string
  value: typeof RRule.MO
}

interface EventFormRecurrenceBuilderProps {
  onChange: (rrule: string) => void
}

const frequencyOptions: Array<{
  value: RecurrenceFrequency
  label: string
}> = [
  { value: "DAILY", label: "Daglig" },
  { value: "WEEKLY", label: "Ukentlig" },
  { value: "MONTHLY", label: "Månedlig" },
]

const weekdayOptions: WeekdayOption[] = [
  { label: "Ma", value: RRule.MO },
  { label: "Ti", value: RRule.TU },
  { label: "On", value: RRule.WE },
  { label: "To", value: RRule.TH },
  { label: "Fr", value: RRule.FR },
  { label: "Lø", value: RRule.SA },
  { label: "Sø", value: RRule.SU },
]

const endTypeOptions: Array<{ value: RecurrenceEndType; label: string }> = [
  { value: "count", label: "Etter antall gjentagelser" },
  { value: "until", label: "På en bestemt dato" },
  { value: "never", label: "Aldri" },
]

export function EventFormRecurrenceBuilder({
  onChange,
}: EventFormRecurrenceBuilderProps) {
  const [input, setInput] = useState(initialRecurrenceInput)
  const recurrence = buildRecurrence(input)

  const updateInput = (patch: Partial<RecurrenceInput>) => {
    const nextInput = { ...input, ...patch }
    setInput(nextInput)
    const nextRecurrence = buildRecurrence(nextInput)
    if (nextRecurrence) {
      onChange(nextRecurrence.rule)
    }
  }

  return (
    <div className="space-y-5 border-2 border-border bg-secondary/10 p-6">
      <RecurrenceHeader />
      <fieldset className="space-y-2">
        <legend className="text-sm text-foreground-muted">Gjentas</legend>
        <SegmentedControl
          onChange={frequency => updateInput({ frequency })}
          options={frequencyOptions}
          value={input.frequency}
        />
      </fieldset>
      <RecurrenceIntervalField
        frequency={input.frequency}
        interval={input.interval}
        onIntervalChange={interval => updateInput({ interval })}
      />
      {input.frequency === "WEEKLY" && (
        <fieldset className="space-y-2">
          <legend className="text-sm text-foreground-muted">Dager</legend>
          <ToggleGroup
            onChange={values => updateInput({ weekdays: values.map(Number) })}
            options={weekdayOptions.map((day, i) => ({
              value: String(i),
              label: day.label,
            }))}
            size="sm"
            value={input.weekdays.map(String)}
          />
        </fieldset>
      )}
      <RecurrenceEndField
        count={input.count}
        endType={input.endType}
        onCountChange={count => updateInput({ count })}
        onEndTypeChange={endType => updateInput({ endType })}
        onUntilDateChange={untilDate => updateInput({ untilDate })}
        untilDate={input.untilDate}
      />
      <RecurrencePreview preview={recurrence?.preview} />{" "}
    </div>
  )
}

function RecurrenceHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-2 rounded-full bg-primary" />
      <p className="font-heading text-sm uppercase tracking-widest text-foreground">
        Gjentagelsesmønster
      </p>
    </div>
  )
}

interface RecurrenceIntervalFieldProps {
  frequency: RecurrenceFrequency
  interval: number
  onIntervalChange: (interval: number) => void
}

function RecurrenceIntervalField({
  frequency,
  interval,
  onIntervalChange,
}: RecurrenceIntervalFieldProps) {
  return (
    <div className="space-y-2">
      <label className="cursor-pointer text-sm text-foreground-muted">
        Intervall - hver{" "}
        <input
          className="mx-1 w-14 border-2 border-border bg-background px-2 py-0.5 text-center text-sm font-heading text-foreground focus-brutal"
          max={52}
          min={1}
          onChange={event =>
            onIntervalChange(Math.max(1, Number(event.target.value)))
          }
          type="number"
          value={interval}
        />
        {getFrequencyUnitLabel(frequency)}
      </label>
    </div>
  )
}

function getFrequencyUnitLabel(frequency: RecurrenceFrequency): string {
  if (frequency === "DAILY") {
    return "dag"
  }

  if (frequency === "MONTHLY") {
    return "måned"
  }

  return "uke"
}

interface RecurrenceEndFieldProps {
  count: number
  endType: RecurrenceEndType
  onCountChange: (count: number) => void
  onEndTypeChange: (endType: RecurrenceEndType) => void
  onUntilDateChange: (untilDate: string) => void
  untilDate: string
}

function RecurrenceEndField({
  count,
  endType,
  onCountChange,
  onEndTypeChange,
  onUntilDateChange,
  untilDate,
}: RecurrenceEndFieldProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm text-foreground-muted">Avsluttes</legend>
      <div className="space-y-2">
        {endTypeOptions.map(option => (
          <label
            className="flex cursor-pointer items-center gap-3"
            key={option.value}
          >
            <input
              checked={endType === option.value}
              className="accent-primary"
              name="endType"
              onChange={() => onEndTypeChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span className="text-sm text-foreground">{option.label}</span>
          </label>
        ))}
      </div>

      {endType === "count" && (
        <div className="pl-6">
          <label className="text-sm text-foreground-muted">
            <input
              className="mr-2 w-16 border-2 border-border bg-background px-2 py-0.5 text-center text-sm font-heading text-foreground focus-brutal"
              max={365}
              min={1}
              onChange={event =>
                onCountChange(Math.max(1, Number(event.target.value)))
              }
              type="number"
              value={count}
            />{" "}
            ganger
          </label>
        </div>
      )}

      {endType === "until" && (
        <div className="pl-6">
          <input
            className="border-2 border-border bg-background px-3 py-1.5 text-sm font-heading text-foreground focus-brutal"
            onChange={event => onUntilDateChange(event.target.value)}
            type="date"
            value={untilDate}
          />
        </div>
      )}
    </fieldset>
  )
}

interface RecurrencePreviewProps {
  preview?: string
}

function RecurrencePreview({ preview }: RecurrencePreviewProps) {
  if (!preview) {
    return null
  }

  return (
    <div className="border-l-4 border-primary py-1 pl-4">
      <p className="text-sm text-foreground-muted">Forhåndsvisning:</p>
      <p className="text-sm font-heading capitalize text-foreground">
        {preview}
      </p>
    </div>
  )
}

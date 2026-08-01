"use client"

import { useState } from "react"
import { RRule } from "rrule"
import { NumberField } from "@/components/ui/number-field"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { ToggleGroup } from "@/components/ui/toggle-group"
import {
  buildRecurrence,
  initialRecurrenceInput,
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
        <legend className=" text-foreground-muted">Gjentas</legend>
        <SegmentedControl
          onValueChange={frequency => updateInput({ frequency })}
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
          <legend className=" text-foreground-muted">Dager</legend>
          <ToggleGroup
            onValueChange={values =>
              updateInput({ weekdays: values.map(Number) })
            }
            options={weekdayOptions.map((day, i) => ({
              value: String(i),
              label: day.label,
            }))}
            size="sm"
            value={input.weekdays.map(String)}
          />
        </fieldset>
      )}
      <p className="text-sm text-foreground-muted">
        Serien opprettes én programperiode om gangen av redaksjonen.
      </p>
      <RecurrencePreview preview={recurrence?.preview} />{" "}
    </div>
  )
}

function RecurrenceHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-2 rounded-full bg-primary" />
      <p className="font-heading uppercase tracking-widest text-foreground">
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
    <div className="flex items-center gap-2 text-foreground-muted">
      <span>Intervall - hver</span>
      <NumberField
        className="w-32"
        max={52}
        min={1}
        onValueChange={value => onIntervalChange(value ?? 1)}
        value={interval}
      />
      <span>{getFrequencyUnitLabel(frequency)}</span>
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

interface RecurrencePreviewProps {
  preview?: string
}

function RecurrencePreview({ preview }: RecurrencePreviewProps) {
  if (!preview) {
    return null
  }

  return (
    <div className="border-l-4 border-primary py-1 pl-4">
      <p className=" text-foreground-muted">Forhåndsvisning:</p>
      <p className=" font-heading capitalize text-foreground">{preview}</p>
    </div>
  )
}

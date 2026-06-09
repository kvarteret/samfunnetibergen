"use client";

import { useEffect, useMemo, useState } from "react";
import { RRule } from "rrule";

import { cn } from "@/lib/utils";

type Frequency = "WEEKLY" | "MONTHLY" | "DAILY";
type EndType = "count" | "until" | "never";

type RecurrenceState = {
  rule: string;
  preview: string;
};

type WeekdayOption = {
  label: string;
  value: typeof RRule.MO;
};

interface EventFormRecurrenceBuilderProps {
  onChange: (rrule: string) => void;
}

const frequencyOptions: Array<{ value: Frequency; label: string }> = [
  { value: "DAILY", label: "Daglig" },
  { value: "WEEKLY", label: "Ukentlig" },
  { value: "MONTHLY", label: "Månedlig" },
];

const weekdayOptions: WeekdayOption[] = [
  { label: "Ma", value: RRule.MO },
  { label: "Ti", value: RRule.TU },
  { label: "On", value: RRule.WE },
  { label: "To", value: RRule.TH },
  { label: "Fr", value: RRule.FR },
  { label: "Lø", value: RRule.SA },
  { label: "Sø", value: RRule.SU },
];

const endTypeOptions: Array<{ value: EndType; label: string }> = [
  { value: "count", label: "Etter antall gjentagelser" },
  { value: "until", label: "På en bestemt dato" },
  { value: "never", label: "Aldri" },
];

export function EventFormRecurrenceBuilder({ onChange }: EventFormRecurrenceBuilderProps) {
  const [frequency, setFrequency] = useState<Frequency>("WEEKLY");
  const [interval, setInterval] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([1]);
  const [endType, setEndType] = useState<EndType>("count");
  const [count, setCount] = useState(8);
  const [untilDate, setUntilDate] = useState("");

  const recurrence = useMemo(
    () =>
      buildRecurrence({
        frequency,
        interval,
        weekdays,
        endType,
        count,
        untilDate,
      }),
    [frequency, interval, weekdays, endType, count, untilDate],
  );

  useEffect(() => {
    if (recurrence) {
      onChange(recurrence.rule);
    }
  }, [recurrence, onChange]);

  const toggleWeekday = (index: number) => {
    setWeekdays((previousWeekdays) =>
      previousWeekdays.includes(index)
        ? previousWeekdays.filter((day) => day !== index)
        : [...previousWeekdays, index],
    );
  };

  return (
    <div className="space-y-5 border-2 border-border bg-secondary/10 p-6">
      <RecurrenceHeader />
      <RecurrenceFrequencyField
        frequency={frequency}
        onFrequencyChange={setFrequency}
      />
      <RecurrenceIntervalField
        frequency={frequency}
        interval={interval}
        onIntervalChange={setInterval}
      />
      {frequency === "WEEKLY" && (
        <RecurrenceWeekdayField
          selectedWeekdays={weekdays}
          onWeekdayToggle={toggleWeekday}
        />
      )}
      <RecurrenceEndField
        count={count}
        endType={endType}
        onCountChange={setCount}
        onEndTypeChange={setEndType}
        onUntilDateChange={setUntilDate}
        untilDate={untilDate}
      />
      <RecurrencePreview preview={recurrence?.preview} />
    </div>
  );
}

function buildRecurrence({
  frequency,
  interval,
  weekdays,
  endType,
  count,
  untilDate,
}: {
  frequency: Frequency;
  interval: number;
  weekdays: number[];
  endType: EndType;
  count: number;
  untilDate: string;
}): RecurrenceState | null {
  try {
    const options: ConstructorParameters<typeof RRule>[0] = {
      freq: getRRuleFrequency(frequency),
      interval,
    };

    if (frequency === "WEEKLY" && weekdays.length > 0) {
      options.byweekday = weekdays.map((day) => weekdayOptions[day].value);
    }

    if (endType === "count") {
      options.count = count;
    } else if (endType === "until" && untilDate) {
      options.until = new Date(untilDate);
    }

    const rule = new RRule(options);

    return {
      rule: rule.toString().replace(/^RRULE:/, ""),
      preview: translateRecurrencePreview(rule.toText()),
    };
  } catch {
    return null;
  }
}

function getRRuleFrequency(frequency: Frequency) {
  if (frequency === "DAILY") {
    return RRule.DAILY;
  }

  if (frequency === "MONTHLY") {
    return RRule.MONTHLY;
  }

  return RRule.WEEKLY;
}

function translateRecurrencePreview(text: string): string {
  return text
    .replace("every", "Hver")
    .replace("week", "uke")
    .replace("day", "dag")
    .replace("month", "måned")
    .replace("for", "i")
    .replace("times", "ganger");
}

function RecurrenceHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-2 rounded-full bg-primary" />
      <p className="font-heading text-sm uppercase tracking-[0.18em] text-foreground">
        Gjentagelsesmønster
      </p>
    </div>
  );
}

interface RecurrenceFrequencyFieldProps {
  frequency: Frequency;
  onFrequencyChange: (frequency: Frequency) => void;
}

function RecurrenceFrequencyField({
  frequency,
  onFrequencyChange,
}: RecurrenceFrequencyFieldProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm text-foreground/70">Gjentas</legend>
      <div className="flex flex-wrap gap-2">
        {frequencyOptions.map((option) => (
          <button
            className={cn(
              "border-2 border-border px-3 py-1.5 text-sm font-heading transition-colors",
              frequency === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted",
            )}
            key={option.value}
            onClick={() => onFrequencyChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface RecurrenceIntervalFieldProps {
  frequency: Frequency;
  interval: number;
  onIntervalChange: (interval: number) => void;
}

function RecurrenceIntervalField({
  frequency,
  interval,
  onIntervalChange,
}: RecurrenceIntervalFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-foreground/70">
        Intervall - hver{" "}
        <input
          className="mx-1 w-14 border-2 border-border bg-background px-2 py-0.5 text-center text-sm font-heading text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          max={52}
          min={1}
          onChange={(event) =>
            onIntervalChange(Math.max(1, Number(event.target.value)))
          }
          type="number"
          value={interval}
        />
        {getFrequencyUnitLabel(frequency)}
      </label>
    </div>
  );
}

function getFrequencyUnitLabel(frequency: Frequency): string {
  if (frequency === "DAILY") {
    return "dag";
  }

  if (frequency === "MONTHLY") {
    return "måned";
  }

  return "uke";
}

interface RecurrenceWeekdayFieldProps {
  selectedWeekdays: number[];
  onWeekdayToggle: (index: number) => void;
}

function RecurrenceWeekdayField({
  selectedWeekdays,
  onWeekdayToggle,
}: RecurrenceWeekdayFieldProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm text-foreground/70">Dager</legend>
      <div className="flex flex-wrap gap-1.5">
        {weekdayOptions.map((day, index) => (
          <button
            className={cn(
              "size-10 border-2 border-border text-sm font-heading transition-colors",
              selectedWeekdays.includes(index)
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted",
            )}
            key={day.label}
            onClick={() => onWeekdayToggle(index)}
            type="button"
          >
            {day.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface RecurrenceEndFieldProps {
  count: number;
  endType: EndType;
  onCountChange: (count: number) => void;
  onEndTypeChange: (endType: EndType) => void;
  onUntilDateChange: (untilDate: string) => void;
  untilDate: string;
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
      <legend className="text-sm text-foreground/70">Avsluttes</legend>
      <div className="space-y-2">
        {endTypeOptions.map((option) => (
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
          <label className="text-sm text-foreground/70">
            <input
              className="mr-2 w-16 border-2 border-border bg-background px-2 py-0.5 text-center text-sm font-heading text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              max={365}
              min={1}
              onChange={(event) =>
                onCountChange(Math.max(1, Number(event.target.value)))
              }
              type="number"
              value={count}
            />
            ganger
          </label>
        </div>
      )}

      {endType === "until" && (
        <div className="pl-6">
          <input
            className="border-2 border-border bg-background px-3 py-1.5 text-sm font-heading text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => onUntilDateChange(event.target.value)}
            type="date"
            value={untilDate}
          />
        </div>
      )}
    </fieldset>
  );
}

interface RecurrencePreviewProps {
  preview?: string;
}

function RecurrencePreview({ preview }: RecurrencePreviewProps) {
  if (!preview) {
    return null;
  }

  return (
    <div className="border-l-4 border-primary py-1 pl-4">
      <p className="text-sm text-foreground/70">Forhåndsvisning:</p>
      <p className="text-sm font-heading capitalize text-foreground">
        {preview}
      </p>
    </div>
  );
}

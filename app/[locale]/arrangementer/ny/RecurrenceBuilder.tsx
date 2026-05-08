"use client"

import { useEffect, useState } from "react"
import { RRule } from "rrule"

type Frequency = "WEEKLY" | "MONTHLY" | "DAILY"
type EndType = "count" | "until" | "never"

const WEEKDAYS = [
    { label: "Ma", value: RRule.MO },
    { label: "Ti", value: RRule.TU },
    { label: "On", value: RRule.WE },
    { label: "To", value: RRule.TH },
    { label: "Fr", value: RRule.FR },
    { label: "Lø", value: RRule.SA },
    { label: "Sø", value: RRule.SU },
]

interface RecurrenceBuilderProps {
    onChange: (rrule: string) => void
}

export function RecurrenceBuilder({ onChange }: RecurrenceBuilderProps) {
    const [frequency, setFrequency] = useState<Frequency>("WEEKLY")
    const [interval, setInterval] = useState(1)
    const [weekdays, setWeekdays] = useState<number[]>([1]) // Monday by default
    const [endType, setEndType] = useState<EndType>("count")
    const [count, setCount] = useState(8)
    const [untilDate, setUntilDate] = useState("")
    const [preview, setPreview] = useState("")

    const toggleWeekday = (index: number) => {
        setWeekdays(prev =>
            prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index],
        )
    }

    useEffect(() => {
        try {
            const options: ConstructorParameters<typeof RRule>[0] = {
                freq:
                    frequency === "DAILY"
                        ? RRule.DAILY
                        : frequency === "WEEKLY"
                          ? RRule.WEEKLY
                          : RRule.MONTHLY,
                interval,
            }

            if (frequency === "WEEKLY" && weekdays.length > 0) {
                options.byweekday = weekdays.map(d => WEEKDAYS[d].value)
            }

            if (endType === "count") {
                options.count = count
            } else if (endType === "until" && untilDate) {
                options.until = new Date(untilDate)
            }

            const rule = new RRule(options)
            const ruleStr = rule.toString().replace(/^RRULE:/, "")
            onChange(ruleStr)

            const text = rule.toText()
            const textNorwegian = text
                .replace("every", "Hver")
                .replace("week", "uke")
                .replace("day", "dag")
                .replace("month", "måned")
                .replace("for", "i")
                .replace("times", "ganger")
            setPreview(textNorwegian)
        } catch {
            // ignore invalid rrule during construction
        }
    }, [frequency, interval, weekdays, endType, count, untilDate, onChange])

    return (
        <div className="border-2 border-border bg-secondary/10 p-6 space-y-5">
            <div className="flex items-center gap-3">
                <div className="size-2 bg-primary rounded-full" />
                <p className="font-heading text-sm uppercase tracking-[0.18em] text-foreground">
                    Gjentagelsesmønster
                </p>
            </div>

            {/* Frequency */}
            <fieldset className="space-y-2">
                <legend className="text-sm text-foreground/70">Gjentas</legend>
                <div className="flex flex-wrap gap-2">
                    {(["DAILY", "WEEKLY", "MONTHLY"] as Frequency[]).map(freq => (
                        <button
                            key={freq}
                            type="button"
                            onClick={() => setFrequency(freq)}
                            className={`border-2 border-border px-3 py-1.5 text-sm font-heading transition-colors ${
                                frequency === freq
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background text-foreground hover:bg-muted"
                            }`}
                        >
                            {freq === "DAILY"
                                ? "Daglig"
                                : freq === "WEEKLY"
                                  ? "Ukentlig"
                                  : "Månedlig"}
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* Interval */}
            <div className="space-y-2">
                <label className="text-sm text-foreground/70">
                    Intervall — hver{" "}
                    <input
                        type="number"
                        min={1}
                        max={52}
                        value={interval}
                        onChange={e => setInterval(Math.max(1, Number(e.target.value)))}
                        className="w-14 border-2 border-border bg-background px-2 py-0.5 text-center text-sm font-heading text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mx-1"
                    />
                    {frequency === "DAILY" ? "dag" : frequency === "WEEKLY" ? "uke" : "måned"}
                </label>
            </div>

            {/* Weekday picker (only for WEEKLY) */}
            {frequency === "WEEKLY" && (
                <fieldset className="space-y-2">
                    <legend className="text-sm text-foreground/70">Dager</legend>
                    <div className="flex gap-1.5 flex-wrap">
                        {WEEKDAYS.map((day, index) => (
                            <button
                                key={day.label}
                                type="button"
                                onClick={() => toggleWeekday(index)}
                                className={`size-10 border-2 border-border text-sm font-heading transition-colors ${
                                    weekdays.includes(index)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background text-foreground hover:bg-muted"
                                }`}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                </fieldset>
            )}

            {/* End condition */}
            <fieldset className="space-y-3">
                <legend className="text-sm text-foreground/70">Avsluttes</legend>
                <div className="space-y-2">
                    {(["count", "until", "never"] as EndType[]).map(type => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="radio"
                                name="endType"
                                value={type}
                                checked={endType === type}
                                onChange={() => setEndType(type)}
                                className="accent-primary"
                            />
                            <span className="text-sm text-foreground">
                                {type === "count"
                                    ? "Etter antall gjentagelser"
                                    : type === "until"
                                      ? "På en bestemt dato"
                                      : "Aldri"}
                            </span>
                        </label>
                    ))}
                </div>

                {endType === "count" && (
                    <div className="pl-6">
                        <label className="text-sm text-foreground/70">
                            <input
                                type="number"
                                min={1}
                                max={365}
                                value={count}
                                onChange={e => setCount(Math.max(1, Number(e.target.value)))}
                                className="w-16 border-2 border-border bg-background px-2 py-0.5 text-center text-sm font-heading text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mr-2"
                            />
                            ganger
                        </label>
                    </div>
                )}
                {endType === "until" && (
                    <div className="pl-6">
                        <input
                            type="date"
                            value={untilDate}
                            onChange={e => setUntilDate(e.target.value)}
                            className="border-2 border-border bg-background px-3 py-1.5 text-sm font-heading text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                )}
            </fieldset>

            {/* Preview */}
            {preview && (
                <div className="border-l-4 border-primary pl-4 py-1">
                    <p className="text-sm text-foreground/70">Forhåndsvisning:</p>
                    <p className="text-sm font-heading text-foreground capitalize">{preview}</p>
                </div>
            )}
        </div>
    )
}

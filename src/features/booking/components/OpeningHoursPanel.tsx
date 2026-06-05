import { Clock } from "lucide-react"

import {
    type ClosedDate,
    formatOpeningHoursRow,
    isHouseClosed,
    minutesToTime,
    type OpeningHours,
    type OpeningHoursRow,
    openingRangesForDate,
} from "@/lib/opening-hours"

interface OpeningHoursPanelProps {
    openingHours: OpeningHours | null
    closedDates: ClosedDate[]
    selectedDate: string
}

export function OpeningHoursPanel({
    openingHours,
    closedDates,
    selectedDate,
}: OpeningHoursPanelProps) {
    const rows = (openingHours?.rows ?? []).filter((row): row is OpeningHoursRow => row != null)
    if (rows.length === 0) return null

    return (
        <div className="border-2 border-border bg-card p-4">
            <p className="flex items-center gap-2 font-heading text-sm text-foreground">
                <Clock aria-hidden className="size-4 text-primary" />
                Åpningstider
            </p>

            {selectedDate && (
                <SelectedDateHours
                    openingHours={openingHours}
                    closedDates={closedDates}
                    selectedDate={selectedDate}
                />
            )}

            <dl className="mt-3 space-y-1 text-sm text-foreground/70">
                {rows.map(row => {
                    const label = formatOpeningHoursRow(row)
                    if (!label) return null
                    return (
                        <div key={row._key ?? label} className="leading-5">
                            {label}
                        </div>
                    )
                })}
            </dl>
        </div>
    )
}

interface SelectedDateHoursProps {
    openingHours: OpeningHours | null
    closedDates: ClosedDate[]
    selectedDate: string
}

function SelectedDateHours({ openingHours, closedDates, selectedDate }: SelectedDateHoursProps) {
    if (isHouseClosed(selectedDate, closedDates)) {
        return <p className="mt-2 text-sm font-heading text-destructive">Stengt denne dagen</p>
    }

    const ranges = openingRangesForDate(selectedDate, openingHours, closedDates)
    if (ranges.length === 0) {
        return <p className="mt-2 text-sm text-foreground/60">Ingen åpningstid registrert.</p>
    }

    return (
        <p className="mt-2 text-sm text-foreground">
            <span className="font-heading">Valgt dag: </span>
            {ranges
                .map(range => `${minutesToTime(range.startMin)}–${minutesToTime(range.endMin)}`)
                .join(", ")}
        </p>
    )
}

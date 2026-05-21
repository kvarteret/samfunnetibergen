"use client"

import { ChevronDown, ExternalLink, Loader2, Mic, X } from "lucide-react"
import { useEffect, useId, useMemo, useState, useTransition } from "react"

import { type CresatBooking, fetchKaraokeAvailability } from "@/app/actions/karaoke-availability"
import { type PriceType, submitKaraokeBooking } from "@/app/actions/submit-karaoke-booking"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    CheckboxSquare,
    FieldGroup,
    FieldHint,
    SectionHeader,
} from "@/features/events/components/FormFields"
import { cn } from "@/lib/utils"
import type { KaraokeRoom, KaraokeRoomImage } from "../types"

const PRICING: Record<PriceType, { perPerson: number; minPerHour: number }> = {
    ordinær: { perPerson: 79, minPerHour: 395 },
    student: { perPerson: 59, minPerHour: 295 },
}

const DURATION_OPTIONS = [1, 2, 3, 4] as const
const DATE_COUNT = 60

// ISO weekday: 1=Mon … 7=Sun
// Ranges that cross midnight: end hour < start hour means "next calendar day"
const WEEKDAY_HOURS: Record<number, { start: number; end: number }> = {
    1: { start: 13, end: 1 }, // Mon: 13:00–01:00
    2: { start: 13, end: 1 }, // Tue
    3: { start: 13, end: 1 }, // Wed
    4: { start: 13, end: 1 }, // Thu
    5: { start: 13, end: 3 }, // Fri: 13:00–03:00
    6: { start: 19, end: 3 }, // Sat: 19:00–03:00
    7: { start: 16, end: 22 }, // Sun: 16:00–22:00
}

function isoWeekday(dateStr: string): number {
    const d = new Date(dateStr)
    return d.getDay() === 0 ? 7 : d.getDay()
}

function getSlotsForDate(dateStr: string, durationHours: number): number[] {
    const wd = isoWeekday(dateStr)
    const range = WEEKDAY_HOURS[wd]
    if (!range) return []

    const { start, end } = range
    const totalOpen = end <= start ? 24 - start + end : end - start

    const slots: number[] = []
    for (let i = 0; i <= totalOpen - durationHours; i++) {
        slots.push((start + i) % 24)
    }
    return slots
}

function formatHour(h: number): string {
    return `${String(h).padStart(2, "0")}:00`
}

function addHours(time: string, hours: number): string {
    if (!time) return ""
    const [h, m] = time.split(":").map(Number)
    const total = h * 60 + m + hours * 60
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function calcPrice(priceType: PriceType, people: number, durationHours: number): number {
    if (people <= 0) return 0
    const p = PRICING[priceType]
    return Math.max(p.perPerson * people, p.minPerHour) * durationHours
}

function formatDate(dateStr: string): string {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("nb-NO", {
        weekday: "short",
        day: "numeric",
        month: "long",
    })
}

function slotOverlapsBookings(
    date: string,
    hour: number,
    durationHours: number,
    bookings: CresatBooking[],
): boolean {
    // Slots starting at hour H on `date`; if H + duration crosses midnight, end is on the next day
    const slotStart = new Date(`${date}T${formatHour(hour)}:00`)
    const slotEnd = new Date(slotStart.getTime() + durationHours * 60 * 60 * 1000)
    return bookings.some(b => {
        const bookStart = new Date(b.start)
        const bookEnd = new Date(b.end)
        return slotStart < bookEnd && slotEnd > bookStart
    })
}

function dateHasAvailableSlot(
    date: string,
    durationHours: number,
    bookings: CresatBooking[],
): boolean {
    return getSlotsForDate(date, durationHours).some(
        h => !slotOverlapsBookings(date, h, durationHours, bookings),
    )
}

// ── OrderPreview ──────────────────────────────────────────────────────────────

interface OrderPreviewProps {
    eventName: string
    startDate: string
    startTime: string
    endTime: string
    duration: number
    priceType: PriceType
    people: number
    totalPrice: number
}

function OrderPreview({
    eventName,
    startDate,
    startTime,
    endTime,
    duration,
    priceType,
    people,
    totalPrice,
}: OrderPreviewProps) {
    const isEmpty = !eventName && !startDate && !people

    return (
        <div className="border-2 border-border bg-card p-5 space-y-4">
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/60">
                Bestillingsoversikt
            </p>
            {isEmpty ? (
                <p className="text-sm text-foreground/40 italic">
                    Fyll ut skjemaet for å se en oversikt.
                </p>
            ) : (
                <div className="space-y-2 text-sm">
                    {eventName && (
                        <div className="flex justify-between gap-4">
                            <span className="text-foreground/60 shrink-0">Arrangement</span>
                            <span className="font-heading text-right truncate">{eventName}</span>
                        </div>
                    )}
                    <div className="flex justify-between gap-4">
                        <span className="text-foreground/60 shrink-0">Rom</span>
                        <span className="font-heading text-right">Maos Lille Røde</span>
                    </div>
                    {startDate && (
                        <div className="flex justify-between gap-4">
                            <span className="text-foreground/60 shrink-0">Dato</span>
                            <span className="font-heading text-right capitalize">
                                {formatDate(startDate)}
                            </span>
                        </div>
                    )}
                    {startTime && (
                        <div className="flex justify-between gap-4">
                            <span className="text-foreground/60 shrink-0">Tid</span>
                            <span className="font-heading text-right">
                                {startTime}
                                {endTime && ` → ${endTime}`}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between gap-4">
                        <span className="text-foreground/60 shrink-0">Varighet</span>
                        <span className="font-heading text-right">
                            {duration} {duration === 1 ? "time" : "timer"}
                        </span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-foreground/60 shrink-0">Pakke</span>
                        <span className="font-heading text-right capitalize">{priceType}</span>
                    </div>
                    {people > 0 && (
                        <div className="flex justify-between gap-4">
                            <span className="text-foreground/60 shrink-0">Antall</span>
                            <span className="font-heading text-right">
                                {people} {people === 1 ? "person" : "personer"}
                            </span>
                        </div>
                    )}
                    {people > 0 && (
                        <div className="flex justify-between gap-4 border-t border-border pt-3 mt-3">
                            <span className="text-foreground/60 shrink-0">Pris</span>
                            <span className="font-heading text-primary text-lg">
                                {totalPrice.toLocaleString("nb-NO")} kr
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── RoomCard ──────────────────────────────────────────────────────────────────

interface RoomCardProps {
    room: KaraokeRoom
}

function RoomCard({ room }: RoomCardProps) {
    const firstImage: KaraokeRoomImage | undefined = room.images?.[0]

    return (
        <div className="border-2 border-border bg-card p-5 space-y-4">
            <div className="aspect-video w-full bg-muted overflow-hidden border-2 border-border/50">
                {firstImage?.assetUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={firstImage.assetUrl}
                        alt={firstImage.alt ?? room.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Mic className="size-10 text-foreground/20" aria-hidden />
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <a
                    className="group flex items-center gap-1.5 font-heading text-base text-foreground hover:text-primary transition-colors"
                    href={`/rom/${room.slug}`}
                >
                    {room.title}
                    <ExternalLink
                        className="size-3.5 opacity-0 group-hover:opacity-60 transition-opacity"
                        aria-hidden
                    />
                </a>
            </div>
            {room.summary && <p className="text-sm leading-6 text-foreground/70">{room.summary}</p>}
            {(room.capacitySeated || room.capacityStanding) && (
                <div className="border-t border-border pt-4 flex gap-6 text-sm">
                    {room.capacitySeated && (
                        <div>
                            <p className="font-heading text-xs uppercase tracking-[0.12em] text-foreground/50 mb-0.5">
                                Sitteplasser
                            </p>
                            <p className="font-heading">{room.capacitySeated}</p>
                        </div>
                    )}
                    {room.capacityStanding && (
                        <div>
                            <p className="font-heading text-xs uppercase tracking-[0.12em] text-foreground/50 mb-0.5">
                                Ståplasser
                            </p>
                            <p className="font-heading">{room.capacityStanding}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── SlotPicker ────────────────────────────────────────────────────────────────

interface SlotPickerProps {
    bookings: CresatBooking[]
    duration: number
    selectedDate: string
    selectedTime: string
    today: string
    onDateChange: (date: string) => void
    onTimeChange: (time: string) => void
}

function SlotPicker({
    bookings,
    duration,
    selectedDate,
    selectedTime,
    today,
    onDateChange,
    onTimeChange,
}: SlotPickerProps) {
    const dates = useMemo(
        () =>
            Array.from({ length: DATE_COUNT }, (_, i) => {
                const d = new Date(today)
                d.setDate(d.getDate() + i)
                return d.toISOString().split("T")[0]
            }),
        [today],
    )

    return (
        <div className="space-y-4">
            {/* Date strip */}
            <div className="overflow-x-auto">
                <div className="flex gap-1.5 pb-1 min-w-max">
                    {dates.map(date => {
                        const available = dateHasAvailableSlot(date, duration, bookings)
                        const isSelected = date === selectedDate
                        const isToday = date === today
                        const d = new Date(date)
                        const weekday = d.toLocaleDateString("nb-NO", { weekday: "short" })
                        const day = d.getDate()
                        const month = d
                            .toLocaleDateString("nb-NO", { month: "short" })
                            .replace(".", "")

                        return (
                            <button
                                key={date}
                                type="button"
                                disabled={!available}
                                onClick={() => {
                                    onDateChange(date)
                                    onTimeChange("")
                                }}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 px-2.5 py-2 border-2 min-w-[52px] transition-colors shrink-0",
                                    isSelected
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : available
                                          ? cn(
                                                "border-border hover:bg-muted cursor-pointer",
                                                isToday && "border-primary/50",
                                            )
                                          : "border-border/30 text-foreground/25 cursor-not-allowed",
                                )}
                            >
                                <span className="text-[10px] uppercase tracking-widest">
                                    {weekday}
                                </span>
                                <span className="text-base font-heading leading-none">{day}</span>
                                <span className="text-[10px]">{month}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Time slot grid */}
            {selectedDate && (
                <div className="space-y-2">
                    <p className="text-xs font-heading uppercase tracking-[0.12em] text-foreground/50">
                        Velg starttidspunkt
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {getSlotsForDate(selectedDate, duration).map(h => {
                            const taken = slotOverlapsBookings(selectedDate, h, duration, bookings)
                            const isSelected = selectedTime === formatHour(h)

                            return (
                                <button
                                    key={h}
                                    type="button"
                                    disabled={taken}
                                    onClick={() => onTimeChange(formatHour(h))}
                                    className={cn(
                                        "py-2.5 text-sm font-heading border-2 text-center transition-colors",
                                        isSelected
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : taken
                                              ? "border-border/30 text-foreground/25 cursor-not-allowed"
                                              : "border-border hover:bg-muted",
                                    )}
                                >
                                    {formatHour(h)}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── KaraokeBookingForm ────────────────────────────────────────────────────────

interface KaraokeBookingFormProps {
    room: KaraokeRoom
}

export function KaraokeBookingForm({ room }: KaraokeBookingFormProps) {
    const uid = useId()
    const [isPending, startTransition] = useTransition()
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")

    const [eventName, setEventName] = useState("")
    const [startDate, setStartDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [duration, setDuration] = useState(2)
    const [description, setDescription] = useState("")
    const [contactName, setContactName] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [contactPhone, setContactPhone] = useState("")
    const [priceType, setPriceType] = useState<PriceType>("student")
    const [numberOfPeople, setNumberOfPeople] = useState("4")
    const [acceptTerms, setAcceptTerms] = useState(false)
    const [bookings, setBookings] = useState<CresatBooking[]>([])
    const [today, setToday] = useState("")

    useEffect(() => {
        const todayStr = new Date().toISOString().split("T")[0]
        setToday(todayStr)

        const end = new Date()
        end.setDate(end.getDate() + DATE_COUNT)
        fetchKaraokeAvailability(todayStr, end.toISOString().split("T")[0]).then(setBookings)
    }, [])

    // Clear selected time if duration change makes it conflict with a booking
    useEffect(() => {
        if (startDate && startTime) {
            const hour = parseInt(startTime.split(":")[0])
            if (slotOverlapsBookings(startDate, hour, duration, bookings)) {
                setStartTime("")
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, bookings])

    const endTime = addHours(startTime, duration)
    const people = parseInt(numberOfPeople) || 0
    const totalPrice = calcPrice(priceType, people, duration)

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (
            !eventName.trim() ||
            !startDate ||
            !startTime ||
            !contactName.trim() ||
            !contactEmail.trim() ||
            !acceptTerms
        )
            return

        startTransition(async () => {
            const result = await submitKaraokeBooking({
                eventName,
                startDate,
                startTime,
                duration,
                endTime,
                description,
                contactName,
                contactEmail,
                contactPhone,
                priceType,
                numberOfPeople: people,
                totalPrice,
            })

            if (result.ok) {
                setSubmitStatus("success")
            } else {
                setSubmitStatus("error")
                setErrorMessage(result.error)
            }
        })
    }

    return (
        <div className="grid gap-12 items-start lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {/* ── Form ─────────────────────────────────────────────────────── */}
            {submitStatus === "success" ? (
                <div className="space-y-4 border-2 border-primary bg-primary/5 p-8">
                    <p className="font-heading text-xl text-foreground">Forespørsel mottatt!</p>
                    <p className="text-sm leading-6 text-foreground/70">
                        Takk for din bookingforespørsel. Vi behandler den så fort vi kan og tar
                        kontakt på e-post.
                    </p>
                </div>
            ) : (
                <form className="min-w-0 space-y-14" noValidate onSubmit={handleSubmit}>
                    {/* 01 — Detaljer */}
                    <section className="space-y-6">
                        <SectionHeader number="01" title="Detaljer" />

                        <FieldGroup>
                            <Label htmlFor={`${uid}-eventName`}>Navn på arrangement *</Label>
                            <Input
                                autoComplete="off"
                                id={`${uid}-eventName`}
                                onChange={e => setEventName(e.target.value)}
                                placeholder="F.eks. Bursdagsfeiring"
                                required
                                value={eventName}
                            />
                        </FieldGroup>

                        <FieldGroup>
                            <Label htmlFor={`${uid}-duration`}>Varighet</Label>
                            <div className="relative max-w-[180px]">
                                <select
                                    className="w-full appearance-none border-2 border-border bg-background px-3 py-2 pr-9 text-sm font-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    id={`${uid}-duration`}
                                    onChange={e => setDuration(Number(e.target.value))}
                                    value={duration}
                                >
                                    {DURATION_OPTIONS.map(h => (
                                        <option key={h} value={h}>
                                            {h} {h === 1 ? "time" : "timer"}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    aria-hidden
                                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50"
                                />
                            </div>
                        </FieldGroup>

                        {today && (
                            <FieldGroup>
                                <Label>Dato og tidspunkt *</Label>
                                <SlotPicker
                                    bookings={bookings}
                                    duration={duration}
                                    selectedDate={startDate}
                                    selectedTime={startTime}
                                    today={today}
                                    onDateChange={setStartDate}
                                    onTimeChange={setStartTime}
                                />
                                {startTime && (
                                    <p className="text-sm text-foreground/60 font-heading mt-1">
                                        {startTime} → {endTime}
                                    </p>
                                )}
                            </FieldGroup>
                        )}

                        <FieldGroup>
                            <Label htmlFor={`${uid}-description`}>Beskrivelse</Label>
                            <textarea
                                className="w-full resize-y border-2 border-border bg-background px-3 py-2 text-sm font-base text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                id={`${uid}-description`}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Fortell oss litt om anledningen..."
                                rows={4}
                                value={description}
                            />
                        </FieldGroup>
                    </section>

                    {/* 02 — Karaokepakke */}
                    <section className="space-y-6">
                        <SectionHeader number="02" title="Karaokepakke" />

                        <FieldHint>
                            Vi tilbyr to prispakker. Drikke kan bestilles som tillegg.
                        </FieldHint>

                        <div className="flex border-2 border-border" role="tablist">
                            {(["ordinær", "student"] as const).map(type => (
                                <button
                                    aria-pressed={priceType === type}
                                    className={cn(
                                        "flex-1 py-2.5 text-sm font-heading uppercase tracking-[0.12em] transition-colors",
                                        priceType === type
                                            ? "bg-primary text-primary-foreground"
                                            : "text-foreground/60 hover:bg-muted hover:text-foreground",
                                    )}
                                    key={type}
                                    onClick={() => setPriceType(type)}
                                    type="button"
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="border-2 border-border bg-card p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-foreground/60">Timepris per person</span>
                                <span className="font-heading">
                                    {PRICING[priceType].perPerson} kr
                                </span>
                            </div>
                        </div>

                        <FieldGroup>
                            <Label htmlFor={`${uid}-people`}>Antall personer *</Label>
                            <div className="relative max-w-[180px]">
                                <select
                                    className="w-full appearance-none border-2 border-border bg-background px-3 py-2 pr-9 text-sm font-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    id={`${uid}-people`}
                                    onChange={e => setNumberOfPeople(e.target.value)}
                                    value={numberOfPeople}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                                        <option key={n} value={n}>
                                            {n} {n === 1 ? "person" : "personer"}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    aria-hidden
                                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50"
                                />
                            </div>
                            <FieldHint>
                                Minimumspris er {PRICING[priceType].minPerHour} kr per time.
                            </FieldHint>
                        </FieldGroup>

                        {people > 0 && (
                            <div className="border-2 border-primary bg-primary/5 p-4">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm text-foreground/70">
                                        Estimert totalpris
                                    </span>
                                    <div className="text-right">
                                        <span className="font-heading text-2xl text-primary">
                                            {totalPrice.toLocaleString("nb-NO")} kr
                                        </span>
                                        <p className="text-xs text-foreground/50 mt-0.5">
                                            {Math.round(totalPrice / people).toLocaleString(
                                                "nb-NO",
                                            )}{" "}
                                            kr per person
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 03 — Kontaktinformasjon */}
                    <section className="space-y-6">
                        <SectionHeader number="03" title="Kontaktinformasjon" />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FieldGroup>
                                <Label htmlFor={`${uid}-contactName`}>Navn *</Label>
                                <Input
                                    autoComplete="name"
                                    id={`${uid}-contactName`}
                                    onChange={e => setContactName(e.target.value)}
                                    placeholder="Fullt navn"
                                    required
                                    value={contactName}
                                />
                            </FieldGroup>

                            <FieldGroup>
                                <Label htmlFor={`${uid}-contactEmail`}>E-post *</Label>
                                <Input
                                    autoComplete="email"
                                    id={`${uid}-contactEmail`}
                                    onChange={e => setContactEmail(e.target.value)}
                                    placeholder="din@epost.no"
                                    required
                                    type="email"
                                    value={contactEmail}
                                />
                            </FieldGroup>
                        </div>

                        <FieldGroup>
                            <Label htmlFor={`${uid}-contactPhone`}>Telefon</Label>
                            <Input
                                autoComplete="tel"
                                id={`${uid}-contactPhone`}
                                onChange={e => setContactPhone(e.target.value)}
                                placeholder="+47 55 55 55 55"
                                type="tel"
                                value={contactPhone}
                            />
                        </FieldGroup>
                    </section>

                    {/* 04 — Vilkår */}
                    <section className="space-y-4">
                        <SectionHeader number="04" title="Vilkår" />
                        <label className="group flex cursor-pointer items-start gap-3">
                            <CheckboxSquare checked={acceptTerms} onChange={setAcceptTerms} />
                            <span className="text-sm leading-6 text-foreground/80">
                                Ved å krysse av denne boksen aksepterer jeg at jeg har lest,
                                forstått og godkjenner{" "}
                                <a
                                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                                    href="/vilkar-for-leie-av-karaoke"
                                >
                                    bruksvilkårene
                                </a>
                                .
                            </span>
                        </label>
                    </section>

                    {/* Submit */}
                    <section className="space-y-4 border-t-2 border-border pt-8">
                        {submitStatus === "error" && (
                            <div className="flex items-start gap-3 border-2 border-destructive bg-destructive/10 px-4 py-3">
                                <X
                                    aria-hidden
                                    className="mt-0.5 size-4 shrink-0 text-destructive"
                                />
                                <div>
                                    <p className="text-sm font-heading text-destructive">
                                        Det oppstod en feil
                                    </p>
                                    <p className="mt-0.5 text-sm text-foreground/70">
                                        {errorMessage}
                                    </p>
                                </div>
                            </div>
                        )}
                        <Button
                            className="w-full sm:w-auto"
                            disabled={isPending || !acceptTerms}
                            size="lg"
                            type="submit"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 aria-hidden className="animate-spin" />
                                    Sender inn...
                                </>
                            ) : (
                                <>
                                    <Mic aria-hidden />
                                    Send bookingforespørsel
                                </>
                            )}
                        </Button>
                    </section>
                </form>
            )}

            {/* ── Right sidebar ─────────────────────────────────────────────── */}
            <aside className="space-y-5 lg:sticky lg:top-8">
                <OrderPreview
                    eventName={eventName}
                    startDate={startDate}
                    startTime={startTime}
                    endTime={endTime}
                    duration={duration}
                    priceType={priceType}
                    people={people}
                    totalPrice={totalPrice}
                />
                <RoomCard room={room} />
            </aside>
        </div>
    )
}

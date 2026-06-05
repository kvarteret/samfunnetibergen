"use client"

import {
    ArrowRight,
    Building2,
    CalendarClock,
    Check,
    Clock,
    Loader2,
    Music,
    Projector,
    User,
    Users,
    UtensilsCrossed,
    X,
    type LucideIcon,
} from "lucide-react"
import Image from "next/image"
import {
    type FormEvent,
    type ReactNode,
    useEffect,
    useId,
    useMemo,
    useReducer,
    useState,
    useTransition,
} from "react"

import { type CresatBooking, fetchRoomAvailability } from "@/app/actions/room-availability"
import { submitRoomBooking } from "@/app/actions/submit-room-booking"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    CheckboxSquare,
    FieldGroup,
    FieldHint,
    SectionHeader,
    SelectField,
} from "@/features/events/components/FormFields"
import { Link } from "@/i18n/navigation"
import { addDaysDateOnly } from "@/lib/integrations/crescat/datetime"
import { cn } from "@/lib/utils"
import {
    buildBookingPayload,
    canSubmitBooking,
    composeCatering,
    composeTechEquipment,
    initialBookingState,
    isExternalBooker,
    reducer,
    type BookerType,
    type BookingFormState,
} from "../domain/formState"
import type { BookingRoom } from "../types"

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = String(Math.floor(i / 2)).padStart(2, "0")
    const m = i % 2 === 0 ? "00" : "30"
    return { value: `${h}:${m}`, label: `${h}:${m}` }
})

const OPEN_CLOSED_OPTIONS = [
    { value: "Åpent", label: "Åpent arrangement" },
    { value: "Lukket", label: "Lukket arrangement" },
]

const FREE_PAID_OPTIONS = [
    { value: "Gratis", label: "Gratis" },
    { value: "Betalt", label: "Betalt" },
]

const BOOKER_OPTIONS: Array<{
    type: BookerType
    label: string
    hint: string
    icon: LucideIcon
}> = [
    {
        type: "ekstern",
        label: "Ekstern / privat",
        hint: "Privatpersoner og bedrifter.",
        icon: User,
    },
    {
        type: "studentorg",
        label: "Studentorganisasjon",
        hint: "Registrert under Studentbergen.no.",
        icon: Users,
    },
    {
        type: "intern",
        label: "Intern",
        hint: "Driftsorganisasjoner og interne arrangører.",
        icon: Building2,
    },
]

const minutesOf = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
}

function slotRangeMs(date: string, startTime: string, endTime: string): [number, number] {
    const baseMs = new Date(`${date}T00:00:00`).getTime()
    const startMs = baseMs + minutesOf(startTime) * 60_000
    const crossesMidnight = minutesOf(endTime) <= minutesOf(startTime)
    const endMs = baseMs + (minutesOf(endTime) + (crossesMidnight ? 1440 : 0)) * 60_000
    return [startMs, endMs]
}

function overlaps(startMs: number, endMs: number, booking: CresatBooking): boolean {
    const bStart = new Date(booking.start).getTime()
    const bEnd = new Date(booking.end).getTime()
    return startMs < bEnd && endMs > bStart
}

function formatBookingTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })
}

interface RoomBookingFormProps {
    rooms: BookingRoom[]
}

export function RoomBookingForm({ rooms }: RoomBookingFormProps) {
    const uid = useId()
    const [isPending, startTransition] = useTransition()
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")
    const [bookings, setBookings] = useState<CresatBooking[]>([])
    const [state, dispatch] = useReducer(reducer, rooms, currentRooms => ({
        ...initialBookingState,
        roomSlug: currentRooms[0]?.slug ?? "",
    }))

    const setField =
        <Key extends keyof BookingFormState>(key: Key) =>
        (value: BookingFormState[Key]) => {
            dispatch({ type: "SET", key, value })
        }

    const selectedRoom = useMemo(
        () => rooms.find(room => room.slug === state.roomSlug),
        [rooms, state.roomSlug],
    )

    useEffect(() => {
        if (!state.startDate) return
        let active = true
        fetchRoomAvailability(state.startDate, addDaysDateOnly(state.startDate, 1)).then(result => {
            if (active) setBookings(result)
        })
        return () => {
            active = false
        }
    }, [state.startDate])

    const roomBookings = useMemo(
        () =>
            selectedRoom ? bookings.filter(b => b.resourceId === selectedRoom.crescatRoomId) : [],
        [bookings, selectedRoom],
    )

    const hasConflict = useMemo(() => {
        if (!state.startDate || roomBookings.length === 0) return false
        const [startMs, endMs] = slotRangeMs(state.startDate, state.startTime, state.endTime)
        return roomBookings.some(b => overlaps(startMs, endMs, b))
    }, [state.startDate, state.startTime, state.endTime, roomBookings])

    const isExternal = isExternalBooker(state.bookerType)
    const canSubmit = canSubmitBooking(state, Boolean(selectedRoom), hasConflict)
    const techSummary = composeTechEquipment(state)
    const cateringSummary = composeCatering(state)

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        if (!canSubmit || !selectedRoom) return

        startTransition(async () => {
            const result = await submitRoomBooking(buildBookingPayload(state, selectedRoom))
            if (result.ok) {
                setSubmitStatus("success")
            } else {
                setSubmitStatus("error")
                setErrorMessage(result.error)
            }
        })
    }

    if (submitStatus === "success") {
        return <BookingSuccess />
    }

    return (
        <form className="min-w-0 space-y-14" noValidate onSubmit={handleSubmit}>
            <section className="space-y-6">
                <SectionHeader number="01" title="Hvem booker" />
                <BookerTypeToggle value={state.bookerType} onChange={setField("bookerType")} />
                {state.bookerType === "studentorg" && (
                    <FieldGroup className="max-w-xl">
                        <Label htmlFor={`${uid}-studentOrg`}>Navn på studentorganisasjon *</Label>
                        <Input
                            id={`${uid}-studentOrg`}
                            onChange={e => setField("studentOrgName")(e.target.value)}
                            placeholder="Registrert under Studentbergen.no"
                            value={state.studentOrgName}
                        />
                    </FieldGroup>
                )}
            </section>

            <section className="space-y-6">
                <SectionHeader number="02" title="Rom og tidspunkt" />
                {rooms.length > 0 ? (
                    <RoomPicker
                        rooms={rooms}
                        selectedSlug={state.roomSlug}
                        onChange={setField("roomSlug")}
                    />
                ) : (
                    <FieldHint>Ingen rom er tilgjengelige for booking akkurat nå.</FieldHint>
                )}

                <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldGroup>
                        <Label htmlFor={`${uid}-date`}>Dato *</Label>
                        <Input
                            id={`${uid}-date`}
                            onChange={e => setField("startDate")(e.target.value)}
                            type="date"
                            value={state.startDate}
                        />
                    </FieldGroup>
                    <SelectField
                        id={`${uid}-doorsTime`}
                        label="Dørene åpner"
                        onChange={setField("doorsTime")}
                        options={TIME_OPTIONS}
                        placeholder="Ikke relevant"
                        value={state.doorsTime}
                    />
                    <SelectField
                        id={`${uid}-startTime`}
                        label="Arrangementet starter *"
                        onChange={setField("startTime")}
                        options={TIME_OPTIONS}
                        value={state.startTime}
                    />
                    <SelectField
                        id={`${uid}-endTime`}
                        label="Arrangementet slutter *"
                        onChange={setField("endTime")}
                        options={TIME_OPTIONS}
                        value={state.endTime}
                    />
                </div>

                {isExternal && (
                    <label className="group flex max-w-3xl cursor-pointer items-start gap-3">
                        <CheckboxSquare
                            checked={state.flexibleDates}
                            onChange={setField("flexibleDates")}
                        />
                        <span className="text-sm leading-6 text-foreground/80">
                            Dato og rom er fleksibelt. Kvarteret kan foreslå et annet tidspunkt
                            eller rom hvis dette passer bedre.
                        </span>
                    </label>
                )}

                {selectedRoom && state.startDate && (
                    <RoomAvailability
                        bookings={roomBookings}
                        hasConflict={hasConflict}
                        roomTitle={selectedRoom.title ?? selectedRoom.slug}
                    />
                )}
            </section>

            <section className="space-y-6">
                <SectionHeader number="03" title="Arrangement" />
                <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldGroup className="sm:col-span-2">
                        <Label htmlFor={`${uid}-eventName`}>Navn på arrangement *</Label>
                        <Input
                            autoComplete="off"
                            id={`${uid}-eventName`}
                            onChange={e => setField("eventName")(e.target.value)}
                            placeholder="F.eks. konsert, møte, foredrag"
                            value={state.eventName}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <Label htmlFor={`${uid}-audience`}>Estimert antall publikum *</Label>
                        <Input
                            id={`${uid}-audience`}
                            min={0}
                            onChange={e => setField("audienceCount")(e.target.value)}
                            placeholder="F.eks. 50"
                            type="number"
                            value={state.audienceCount}
                        />
                    </FieldGroup>
                    <SelectField
                        id={`${uid}-openClosed`}
                        label="Åpent / lukket *"
                        onChange={value =>
                            setField("openOrClosed")(value as BookingFormState["openOrClosed"])
                        }
                        options={OPEN_CLOSED_OPTIONS}
                        value={state.openOrClosed}
                    />
                    <FieldGroup className="sm:col-span-2">
                        <Label htmlFor={`${uid}-description`}>Beskrivelse</Label>
                        <Textarea
                            id={`${uid}-description`}
                            onChange={setField("description")}
                            placeholder="Fortell oss kort om arrangementet ditt..."
                            value={state.description}
                        />
                    </FieldGroup>
                </div>
            </section>

            <section className="space-y-6">
                <SectionHeader number="04" title="Behov" />
                <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldGroup className="sm:col-span-2">
                        <Label htmlFor={`${uid}-furniture`}>Ønsket møblement *</Label>
                        <Input
                            id={`${uid}-furniture`}
                            onChange={e => setField("furniture")(e.target.value)}
                            placeholder="F.eks. bord og stoler til 30 personer"
                            value={state.furniture}
                        />
                    </FieldGroup>
                    <ToggleOption
                        checked={state.micEnabled}
                        icon={Users}
                        label="Mikrofoner"
                        onChange={setField("micEnabled")}
                    >
                        {state.micEnabled && (
                            <div className="mt-3 flex items-center gap-3">
                                <Label htmlFor={`${uid}-micQuantity`}>Antall</Label>
                                <Input
                                    className="w-24"
                                    id={`${uid}-micQuantity`}
                                    min={1}
                                    onChange={e =>
                                        setField("micQuantity")(Number(e.target.value) || 1)
                                    }
                                    type="number"
                                    value={state.micQuantity}
                                />
                            </div>
                        )}
                    </ToggleOption>
                    <ToggleOption
                        checked={state.projector}
                        icon={Projector}
                        label="Projektor + lerret"
                        onChange={setField("projector")}
                    />
                    <ToggleOption
                        checked={state.music}
                        icon={Music}
                        label="Musikkavspilling"
                        onChange={setField("music")}
                    />
                    <ToggleOption
                        checked={state.soundTech}
                        icon={Clock}
                        label="Dedikert lydtekniker"
                        onChange={setField("soundTech")}
                    />
                    <ToggleOption
                        checked={state.lightTech}
                        icon={Clock}
                        label="Dedikert lystekniker"
                        onChange={setField("lightTech")}
                    />
                </div>
                <FieldHint>
                    Nødvendig teknisk utstyr sendes til Crescat som: {techSummary}
                </FieldHint>
            </section>

            <section className="space-y-6">
                <SectionHeader number="05" title="Mat og bar" />
                <div className="max-w-3xl space-y-4">
                    <ToggleOption
                        checked={state.cateringCustom}
                        icon={UtensilsCrossed}
                        label="Skreddersydd meny"
                        onChange={setField("cateringCustom")}
                    >
                        {state.cateringCustom && (
                            <div className="mt-3">
                                <Textarea
                                    id={`${uid}-catering`}
                                    onChange={setField("cateringText")}
                                    placeholder="Beskriv ønsker om mat, snacks eller drikke."
                                    value={state.cateringText}
                                />
                            </div>
                        )}
                    </ToggleOption>
                    <ToggleOption
                        checked={state.bar}
                        icon={UtensilsCrossed}
                        label="Kvarteret stiller i bar"
                        onChange={setField("bar")}
                    >
                        <FieldHint>Pris: 2000 kr eks. mva.</FieldHint>
                    </ToggleOption>
                    {cateringSummary && (
                        <p className="whitespace-pre-line border-l-2 border-border pl-4 text-sm leading-6 text-foreground/70">
                            {cateringSummary}
                        </p>
                    )}
                </div>
            </section>

            <section className="space-y-6">
                <SectionHeader number="06" title="Billett" />
                <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField
                        id={`${uid}-freePaid`}
                        label="Gratis / betalt *"
                        onChange={value =>
                            setField("freeOrPaid")(value as BookingFormState["freeOrPaid"])
                        }
                        options={FREE_PAID_OPTIONS}
                        value={state.freeOrPaid}
                    />
                    {state.freeOrPaid === "Betalt" && (
                        <FieldGroup>
                            <Label htmlFor={`${uid}-tickets`}>Billettyper og priser</Label>
                            <Input
                                id={`${uid}-tickets`}
                                onChange={e => setField("ticketTypes")(e.target.value)}
                                placeholder="F.eks. Ordinær 150 kr, student 100 kr"
                                value={state.ticketTypes}
                            />
                        </FieldGroup>
                    )}
                </div>
            </section>

            <section className="space-y-6">
                <SectionHeader number="07" title="Kontaktinformasjon" />
                <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldGroup>
                        <Label htmlFor={`${uid}-contactName`}>Navn *</Label>
                        <Input
                            autoComplete="name"
                            id={`${uid}-contactName`}
                            onChange={e => setField("contactName")(e.target.value)}
                            placeholder="Fullt navn"
                            value={state.contactName}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <Label htmlFor={`${uid}-contactEmail`}>E-post *</Label>
                        <Input
                            autoComplete="email"
                            id={`${uid}-contactEmail`}
                            onChange={e => setField("contactEmail")(e.target.value)}
                            placeholder="din@epost.no"
                            type="email"
                            value={state.contactEmail}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <Label htmlFor={`${uid}-contactPhone`}>Telefon</Label>
                        <Input
                            autoComplete="tel"
                            id={`${uid}-contactPhone`}
                            onChange={e => setField("contactPhone")(e.target.value)}
                            placeholder="+47 55 55 55 55"
                            type="tel"
                            value={state.contactPhone}
                        />
                    </FieldGroup>
                    {isExternal && (
                        <>
                            <FieldGroup>
                                <Label htmlFor={`${uid}-invoiceAddress`}>Fakturaadresse *</Label>
                                <Input
                                    id={`${uid}-invoiceAddress`}
                                    onChange={e => setField("invoiceAddress")(e.target.value)}
                                    placeholder="Adresse for faktura"
                                    value={state.invoiceAddress}
                                />
                            </FieldGroup>
                            <FieldGroup>
                                <Label htmlFor={`${uid}-orgNumber`}>Org.nr.</Label>
                                <Input
                                    id={`${uid}-orgNumber`}
                                    onChange={e => setField("orgNumber")(e.target.value)}
                                    placeholder="Valgfritt"
                                    type="number"
                                    value={state.orgNumber}
                                />
                            </FieldGroup>
                        </>
                    )}
                </div>
            </section>

            <section className="space-y-4">
                <SectionHeader number="08" title="Vilkår" />
                <label className="group flex max-w-3xl cursor-pointer items-start gap-3">
                    <CheckboxSquare
                        checked={state.acceptTerms}
                        onChange={setField("acceptTerms")}
                    />
                    <span className="text-sm leading-6 text-foreground/80">
                        Jeg har lest, forstått og godkjenner Det Akademiske Kvarters bookingvilkår.
                    </span>
                </label>
            </section>

            <section className="space-y-4 border-t-2 border-border pt-8">
                {submitStatus === "error" && (
                    <div className="flex max-w-3xl items-start gap-3 border-2 border-destructive bg-destructive/10 px-4 py-3">
                        <X aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
                        <div>
                            <p className="text-sm font-heading text-destructive">
                                Det oppstod en feil
                            </p>
                            <p className="mt-0.5 text-sm text-foreground/70">{errorMessage}</p>
                        </div>
                    </div>
                )}
                <Button
                    className="w-full sm:w-auto"
                    disabled={isPending || !canSubmit}
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
                            <ArrowRight aria-hidden />
                            Send bookingforespørsel
                        </>
                    )}
                </Button>
            </section>
        </form>
    )
}

interface BookerTypeToggleProps {
    value: BookerType
    onChange: (value: BookerType) => void
}

function BookerTypeToggle({ value, onChange }: BookerTypeToggleProps) {
    return (
        <div className="grid gap-3 md:grid-cols-3">
            {BOOKER_OPTIONS.map(option => {
                const Icon = option.icon
                const selected = value === option.type
                return (
                    <button
                        aria-pressed={selected}
                        className={cn(
                            "flex min-h-32 flex-col gap-2 border-2 p-4 text-left transition-colors",
                            selected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted",
                        )}
                        key={option.type}
                        onClick={() => onChange(option.type)}
                        type="button"
                    >
                        <span className="flex items-center gap-2 font-heading text-foreground">
                            <Icon aria-hidden className="size-4 text-primary" />
                            {option.label}
                        </span>
                        <span className="text-sm leading-5 text-foreground/65">{option.hint}</span>
                    </button>
                )
            })}
        </div>
    )
}

interface RoomPickerProps {
    rooms: BookingRoom[]
    selectedSlug: string
    onChange: (slug: string) => void
}

function RoomPicker({ rooms, selectedSlug, onChange }: RoomPickerProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map(room => {
                const selected = selectedSlug === room.slug
                const imageUrl = room.image?.assetUrl
                return (
                    <button
                        aria-pressed={selected}
                        className={cn(
                            "group overflow-hidden border-2 bg-card text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected ? "border-primary" : "border-border hover:border-primary",
                        )}
                        key={room.slug}
                        onClick={() => onChange(room.slug)}
                        type="button"
                    >
                        <div className="relative aspect-[16/9] bg-muted">
                            {imageUrl ? (
                                <Image
                                    alt={room.image?.alt ?? room.title ?? room.slug}
                                    className="object-cover"
                                    fill
                                    sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 100vw"
                                    src={imageUrl}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-foreground/30">
                                    <Building2 aria-hidden className="size-8" />
                                </div>
                            )}
                            {selected && (
                                <span className="absolute right-3 top-3 flex size-7 items-center justify-center bg-primary text-primary-foreground">
                                    <Check aria-hidden className="size-4" />
                                </span>
                            )}
                        </div>
                        <div className="space-y-2 p-4">
                            <p className="font-heading text-lg text-foreground">
                                {room.title ?? room.slug}
                            </p>
                            {room.summary && (
                                <p className="line-clamp-2 text-sm leading-5 text-foreground/65">
                                    {room.summary}
                                </p>
                            )}
                            <p className="text-xs text-foreground/50">
                                {[
                                    room.capacityStanding && `${room.capacityStanding} stående`,
                                    room.capacitySeated && `${room.capacitySeated} sittende`,
                                ]
                                    .filter(Boolean)
                                    .join(" / ")}
                            </p>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

interface ToggleOptionProps {
    checked: boolean
    icon: LucideIcon
    label: string
    children?: ReactNode
    onChange: (checked: boolean) => void
}

function ToggleOption({ checked, icon: Icon, label, children, onChange }: ToggleOptionProps) {
    return (
        <div
            className={cn(
                "border-2 p-4 transition-colors",
                checked ? "border-primary bg-primary/5" : "border-border bg-card",
            )}
        >
            <label className="group flex cursor-pointer items-start gap-3">
                <CheckboxSquare checked={checked} onChange={onChange} />
                <span className="flex min-w-0 flex-1 items-center gap-2 font-heading text-sm text-foreground">
                    <Icon aria-hidden className="size-4 text-primary" />
                    {label}
                </span>
            </label>
            {children}
        </div>
    )
}

interface RoomAvailabilityProps {
    bookings: CresatBooking[]
    hasConflict: boolean
    roomTitle: string
}

function RoomAvailability({ bookings, hasConflict, roomTitle }: RoomAvailabilityProps) {
    return (
        <div
            className={cn(
                "max-w-3xl border-2 p-4 space-y-2",
                hasConflict ? "border-destructive bg-destructive/10" : "border-border bg-card",
            )}
        >
            <p className="flex items-center gap-2 font-heading text-sm text-foreground">
                <CalendarClock aria-hidden className="size-4 text-primary" />
                {roomTitle} - opptatt denne dagen
            </p>
            {bookings.length === 0 ? (
                <p className="text-sm text-foreground/60">
                    Ingen registrerte bookinger denne dagen.
                </p>
            ) : (
                <ul className="space-y-1 text-sm text-foreground/75">
                    {bookings.map(booking => (
                        <li key={booking.id} className="flex justify-between gap-4">
                            <span className="font-heading">
                                {formatBookingTime(booking.start)}-{formatBookingTime(booking.end)}
                            </span>
                            <span className="truncate text-foreground/55">{booking.title}</span>
                        </li>
                    ))}
                </ul>
            )}
            {hasConflict && (
                <p className="text-sm font-heading text-destructive">
                    Valgt tidsrom overlapper en eksisterende booking. Velg et annet tidspunkt.
                </p>
            )}
        </div>
    )
}

interface TextareaProps {
    id: string
    value: string
    placeholder?: string
    onChange: (value: string) => void
}

function Textarea({ id, value, placeholder, onChange }: TextareaProps) {
    return (
        <textarea
            className="w-full resize-y border-2 border-border bg-background px-3 py-2 text-sm font-base text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            id={id}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            value={value}
        />
    )
}

function BookingSuccess() {
    return (
        <div className="max-w-2xl space-y-4 border-2 border-primary bg-primary/5 p-8">
            <p className="font-heading text-xl text-foreground">Forespørsel mottatt!</p>
            <p className="text-sm leading-6 text-foreground/70">
                Takk for din bookingforespørsel. Vi behandler den så fort vi kan og tar kontakt på
                e-post.
            </p>
            <Link
                className="inline-flex text-sm uppercase tracking-[0.18em] underline underline-offset-4 text-primary"
                href="/rom"
            >
                Tilbake til rom
            </Link>
        </div>
    )
}

"use client"

import { ArrowRight, Building2, CalendarClock, Loader2, User, X } from "lucide-react"
import { useEffect, useId, useMemo, useState, useTransition } from "react"

import { type CresatBooking, fetchRoomAvailability } from "@/app/actions/room-availability"
import { type RoomBookingPayload, submitRoomBooking } from "@/app/actions/submit-room-booking"
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
import type { BookerType } from "@/lib/integrations/crescat/room-booking"
import { cn } from "@/lib/utils"
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

const minutesOf = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
}

// Absolute millisecond range for a slot, advancing the end past midnight when
// the end time is at or before the start time.
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

    const [bookerType, setBookerType] = useState<BookerType>("ekstern")
    const [roomSlug, setRoomSlug] = useState(rooms[0]?.slug ?? "")
    const [eventName, setEventName] = useState("")
    const [startDate, setStartDate] = useState("")
    const [startTime, setStartTime] = useState("18:00")
    const [endTime, setEndTime] = useState("22:00")
    const [audienceCount, setAudienceCount] = useState("")
    const [openOrClosed, setOpenOrClosed] = useState("Åpent")
    const [description, setDescription] = useState("")
    const [furniture, setFurniture] = useState("")
    const [techEquipment, setTechEquipment] = useState("")
    const [cateringWishes, setCateringWishes] = useState("")
    const [freeOrPaid, setFreeOrPaid] = useState("Gratis")
    const [ticketTypes, setTicketTypes] = useState("")
    const [contactName, setContactName] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [contactPhone, setContactPhone] = useState("")
    const [onBehalfOfStudentOrg, setOnBehalfOfStudentOrg] = useState(false)
    const [studentOrgName, setStudentOrgName] = useState("")
    const [invoiceAddress, setInvoiceAddress] = useState("")
    const [orgNumber, setOrgNumber] = useState("")
    const [acceptTerms, setAcceptTerms] = useState(false)
    const [bookings, setBookings] = useState<CresatBooking[]>([])

    const isExternal = bookerType === "ekstern"
    const selectedRoom = useMemo(
        () => rooms.find(room => room.slug === roomSlug),
        [rooms, roomSlug],
    )

    // Pull the venue calendar for the selected date so we can flag clashes for
    // the chosen room. Covers only rooms on the standard venue calendar.
    useEffect(() => {
        if (!startDate) return
        let active = true
        const end = new Date(`${startDate}T00:00:00`)
        end.setDate(end.getDate() + 1)
        fetchRoomAvailability(startDate, end.toISOString().split("T")[0]).then(result => {
            if (active) setBookings(result)
        })
        return () => {
            active = false
        }
    }, [startDate])

    const roomBookings = useMemo(
        () =>
            selectedRoom ? bookings.filter(b => b.resourceId === selectedRoom.crescatRoomId) : [],
        [bookings, selectedRoom],
    )

    const hasConflict = useMemo(() => {
        if (!startDate || roomBookings.length === 0) return false
        const [startMs, endMs] = slotRangeMs(startDate, startTime, endTime)
        return roomBookings.some(b => overlaps(startMs, endMs, b))
    }, [startDate, startTime, endTime, roomBookings])

    const canSubmit =
        Boolean(selectedRoom) &&
        eventName.trim() !== "" &&
        startDate !== "" &&
        !hasConflict &&
        audienceCount.trim() !== "" &&
        furniture.trim() !== "" &&
        techEquipment.trim() !== "" &&
        contactName.trim() !== "" &&
        contactEmail.trim() !== "" &&
        (!isExternal || invoiceAddress.trim() !== "") &&
        acceptTerms

    const roomOptions = rooms.map(room => ({
        value: room.slug,
        label: room.title ?? room.slug,
    }))

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (!canSubmit || !selectedRoom) return

        const payload: RoomBookingPayload = {
            bookerType,
            eventName,
            roomId: selectedRoom.crescatRoomId,
            startDate,
            startTime,
            endTime,
            description,
            audienceCount: Number(audienceCount) || 0,
            openOrClosed: openOrClosed as "Åpent" | "Lukket",
            furniture,
            techEquipment,
            cateringWishes,
            freeOrPaid: freeOrPaid as "Gratis" | "Betalt",
            ticketTypes,
            contactName,
            contactEmail,
            contactPhone,
            acceptTerms: true,
            ...(isExternal
                ? {
                      onBehalfOfStudentOrg,
                      studentOrgName,
                      invoiceAddress,
                      orgNumber: orgNumber.trim() ? Number(orgNumber) : null,
                  }
                : {}),
        }

        startTransition(async () => {
            const result = await submitRoomBooking(payload)
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
        <form className="min-w-0 max-w-2xl space-y-14" noValidate onSubmit={handleSubmit}>
            <section className="space-y-6">
                <SectionHeader number="01" title="Hvem booker" />
                <BookerTypeToggle value={bookerType} onChange={setBookerType} />
            </section>

            <section className="space-y-6">
                <SectionHeader number="02" title="Arrangement" />

                {rooms.length > 0 ? (
                    <SelectField
                        id={`${uid}-room`}
                        label="Rom *"
                        onChange={setRoomSlug}
                        options={roomOptions}
                        value={roomSlug}
                    />
                ) : (
                    <FieldHint>Ingen rom er tilgjengelige for booking akkurat nå.</FieldHint>
                )}

                <FieldGroup>
                    <Label htmlFor={`${uid}-eventName`}>Navn på arrangement *</Label>
                    <Input
                        autoComplete="off"
                        id={`${uid}-eventName`}
                        onChange={e => setEventName(e.target.value)}
                        placeholder="F.eks. Vorspiel, konsert, møte"
                        required
                        value={eventName}
                    />
                </FieldGroup>

                <FieldGroup>
                    <Label htmlFor={`${uid}-date`}>Dato *</Label>
                    <Input
                        id={`${uid}-date`}
                        onChange={e => setStartDate(e.target.value)}
                        type="date"
                        value={startDate}
                    />
                </FieldGroup>

                <div className="grid grid-cols-2 gap-4">
                    <SelectField
                        id={`${uid}-startTime`}
                        label="Fra *"
                        onChange={setStartTime}
                        options={TIME_OPTIONS}
                        value={startTime}
                    />
                    <SelectField
                        id={`${uid}-endTime`}
                        label="Til *"
                        onChange={setEndTime}
                        options={TIME_OPTIONS}
                        value={endTime}
                    />
                </div>

                {selectedRoom && startDate && (
                    <RoomAvailability
                        bookings={roomBookings}
                        hasConflict={hasConflict}
                        roomTitle={selectedRoom.title ?? selectedRoom.slug}
                    />
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldGroup>
                        <Label htmlFor={`${uid}-audience`}>Estimert antall publikum *</Label>
                        <Input
                            id={`${uid}-audience`}
                            min={0}
                            onChange={e => setAudienceCount(e.target.value)}
                            placeholder="F.eks. 50"
                            type="number"
                            value={audienceCount}
                        />
                    </FieldGroup>
                    <SelectField
                        id={`${uid}-openClosed`}
                        label="Åpent / lukket *"
                        onChange={setOpenOrClosed}
                        options={OPEN_CLOSED_OPTIONS}
                        value={openOrClosed}
                    />
                </div>

                <FieldGroup>
                    <Label htmlFor={`${uid}-description`}>Beskrivelse</Label>
                    <Textarea
                        id={`${uid}-description`}
                        onChange={setDescription}
                        placeholder="Fortell oss kort om arrangementet ditt..."
                        value={description}
                    />
                </FieldGroup>
            </section>

            <section className="space-y-6">
                <SectionHeader number="03" title="Behov" />
                <FieldGroup>
                    <Label htmlFor={`${uid}-furniture`}>Ønsket møblement *</Label>
                    <Input
                        id={`${uid}-furniture`}
                        onChange={e => setFurniture(e.target.value)}
                        placeholder="F.eks. bord og stoler til 30 personer"
                        value={furniture}
                    />
                </FieldGroup>
                <FieldGroup>
                    <Label htmlFor={`${uid}-tech`}>Nødvendig teknisk utstyr *</Label>
                    <Input
                        id={`${uid}-tech`}
                        onChange={e => setTechEquipment(e.target.value)}
                        placeholder="F.eks. mikrofon, projektor"
                        value={techEquipment}
                    />
                </FieldGroup>
                <FieldGroup>
                    <Label htmlFor={`${uid}-catering`}>Bar / catering</Label>
                    <Textarea
                        id={`${uid}-catering`}
                        onChange={setCateringWishes}
                        placeholder="Beskriv eventuelle ønsker om mat, snacks, drikke eller bar. La stå tom om det ikke er aktuelt."
                        value={cateringWishes}
                    />
                </FieldGroup>
            </section>

            <section className="space-y-6">
                <SectionHeader number="04" title="Billett" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField
                        id={`${uid}-freePaid`}
                        label="Gratis / betalt *"
                        onChange={setFreeOrPaid}
                        options={FREE_PAID_OPTIONS}
                        value={freeOrPaid}
                    />
                    {freeOrPaid === "Betalt" && (
                        <FieldGroup>
                            <Label htmlFor={`${uid}-tickets`}>Billettyper og priser</Label>
                            <Input
                                id={`${uid}-tickets`}
                                onChange={e => setTicketTypes(e.target.value)}
                                placeholder="F.eks. Ordinær 150 kr, student 100 kr"
                                value={ticketTypes}
                            />
                        </FieldGroup>
                    )}
                </div>
            </section>

            <section className="space-y-6">
                <SectionHeader number="05" title="Kontaktinformasjon" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldGroup>
                        <Label htmlFor={`${uid}-contactName`}>Navn *</Label>
                        <Input
                            autoComplete="name"
                            id={`${uid}-contactName`}
                            onChange={e => setContactName(e.target.value)}
                            placeholder="Fullt navn"
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

                {isExternal && (
                    <ExternalContactFields
                        invoiceAddress={invoiceAddress}
                        onBehalfOfStudentOrg={onBehalfOfStudentOrg}
                        orgNumber={orgNumber}
                        studentOrgName={studentOrgName}
                        uid={uid}
                        onInvoiceAddressChange={setInvoiceAddress}
                        onOnBehalfChange={setOnBehalfOfStudentOrg}
                        onOrgNumberChange={setOrgNumber}
                        onStudentOrgNameChange={setStudentOrgName}
                    />
                )}
            </section>

            <section className="space-y-4">
                <SectionHeader number="06" title="Vilkår" />
                <label className="group flex cursor-pointer items-start gap-3">
                    <CheckboxSquare checked={acceptTerms} onChange={setAcceptTerms} />
                    <span className="text-sm leading-6 text-foreground/80">
                        Jeg har lest, forstått og godkjenner Det Akademiske Kvarters bookingvilkår.
                    </span>
                </label>
            </section>

            <section className="space-y-4 border-t-2 border-border pt-8">
                {submitStatus === "error" && (
                    <div className="flex items-start gap-3 border-2 border-destructive bg-destructive/10 px-4 py-3">
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
    const options: Array<{ type: BookerType; label: string; hint: string; icon: typeof User }> = [
        {
            type: "ekstern",
            label: "Ekstern / privat",
            hint: "Privatpersoner, bedrifter og studentorganisasjoner.",
            icon: User,
        },
        {
            type: "intern",
            label: "Intern",
            hint: "Driftsorganisasjoner og interne arrangører på Kvarteret.",
            icon: Building2,
        },
    ]

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {options.map(option => {
                const Icon = option.icon
                const selected = value === option.type
                return (
                    <button
                        aria-pressed={selected}
                        className={cn(
                            "flex flex-col gap-2 border-2 p-4 text-left transition-colors",
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

interface RoomAvailabilityProps {
    bookings: CresatBooking[]
    hasConflict: boolean
    roomTitle: string
}

function RoomAvailability({ bookings, hasConflict, roomTitle }: RoomAvailabilityProps) {
    return (
        <div
            className={cn(
                "border-2 p-4 space-y-2",
                hasConflict ? "border-destructive bg-destructive/10" : "border-border bg-card",
            )}
        >
            <p className="flex items-center gap-2 font-heading text-sm text-foreground">
                <CalendarClock aria-hidden className="size-4 text-primary" />
                {roomTitle} — opptatt denne dagen
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
                                {formatBookingTime(booking.start)}–{formatBookingTime(booking.end)}
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

interface ExternalContactFieldsProps {
    invoiceAddress: string
    onBehalfOfStudentOrg: boolean
    orgNumber: string
    studentOrgName: string
    uid: string
    onInvoiceAddressChange: (value: string) => void
    onOnBehalfChange: (value: boolean) => void
    onOrgNumberChange: (value: string) => void
    onStudentOrgNameChange: (value: string) => void
}

function ExternalContactFields({
    invoiceAddress,
    onBehalfOfStudentOrg,
    orgNumber,
    studentOrgName,
    uid,
    onInvoiceAddressChange,
    onOnBehalfChange,
    onOrgNumberChange,
    onStudentOrgNameChange,
}: ExternalContactFieldsProps) {
    return (
        <div className="space-y-6 border-t border-border pt-6">
            <label className="group flex cursor-pointer items-start gap-3">
                <CheckboxSquare checked={onBehalfOfStudentOrg} onChange={onOnBehalfChange} />
                <span className="text-sm leading-6 text-foreground/80">
                    Bookingen er på vegne av en studentorganisasjon.
                </span>
            </label>

            {onBehalfOfStudentOrg && (
                <FieldGroup>
                    <Label htmlFor={`${uid}-studentOrg`}>Navn på studentorganisasjon</Label>
                    <Input
                        id={`${uid}-studentOrg`}
                        onChange={e => onStudentOrgNameChange(e.target.value)}
                        placeholder="Registrert under Studentbergen.no"
                        value={studentOrgName}
                    />
                </FieldGroup>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldGroup>
                    <Label htmlFor={`${uid}-invoiceAddress`}>Fakturaadresse *</Label>
                    <Input
                        id={`${uid}-invoiceAddress`}
                        onChange={e => onInvoiceAddressChange(e.target.value)}
                        placeholder="Adresse for faktura"
                        value={invoiceAddress}
                    />
                </FieldGroup>
                <FieldGroup>
                    <Label htmlFor={`${uid}-orgNumber`}>Org.nr.</Label>
                    <Input
                        id={`${uid}-orgNumber`}
                        onChange={e => onOrgNumberChange(e.target.value)}
                        placeholder="Valgfritt"
                        type="number"
                        value={orgNumber}
                    />
                </FieldGroup>
            </div>
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
                ← Tilbake til rom
            </Link>
        </div>
    )
}

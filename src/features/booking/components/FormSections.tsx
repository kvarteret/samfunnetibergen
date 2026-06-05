"use client"

import {
    Building2,
    CalendarClock,
    Check,
    Info,
    type LucideIcon,
    Music,
    Projector,
    User,
    Users,
    UtensilsCrossed,
    Volume2,
    Wand2,
} from "lucide-react"
import Image from "next/image"
import { type ReactNode, useState } from "react"

import type { CresatBooking } from "@/app/actions/room-availability"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    CheckboxSquare,
    FieldGroup,
    FieldHint,
    SectionHeader,
    SelectField,
} from "@/features/events/components/FormFields"
import { cn } from "@/lib/utils"
import { formatBookingTime } from "../domain/availability"
import {
    type BookerType,
    type BookingFormState,
    composeCatering,
    composeTechEquipment,
    isExternalBooker,
    type SetBookingField,
} from "../domain/formState"
import type { BookingRoom } from "../types"

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
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

const BOOKER_OPTIONS: Array<{ type: BookerType; label: string; hint: string; icon: LucideIcon }> = [
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

const TERMS_URL = "https://kvarteret.no/leie-av-lokaler/"
const CANCELLATION_URL = "https://kvarteret.no/avbestillingsvilkar/"

interface SectionProps {
    state: BookingFormState
    setField: SetBookingField
    uid: string
}

// — 01 —
export function BookerTypeSection({ state, setField, uid }: SectionProps) {
    return (
        <section className="space-y-6">
            <SectionHeader number="01" title="Hvem booker" />
            <div className="grid gap-3 md:grid-cols-3">
                {BOOKER_OPTIONS.map(option => (
                    <SelectableCard
                        key={option.type}
                        selected={state.bookerType === option.type}
                        onSelect={() => setField("bookerType")(option.type)}
                    >
                        <span className="flex items-center gap-2 font-heading text-foreground">
                            <option.icon aria-hidden className="size-4 text-primary" />
                            {option.label}
                        </span>
                        <span className="text-sm leading-5 text-foreground/65">{option.hint}</span>
                    </SelectableCard>
                ))}
            </div>
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
    )
}

// — 02 —
interface ScheduleSectionProps extends SectionProps {
    rooms: BookingRoom[]
    occupiedSlugs: Set<string>
    roomBookings: CresatBooking[]
    hasConflict: boolean
    selectedRoomTitle?: string
}

export function ScheduleSection({
    state,
    setField,
    uid,
    rooms,
    occupiedSlugs,
    roomBookings,
    hasConflict,
    selectedRoomTitle,
}: ScheduleSectionProps) {
    return (
        <section className="space-y-6">
            <SectionHeader number="02" title="Rom og tidspunkt" />
            {rooms.length > 0 ? (
                <RoomPicker
                    occupiedSlugs={occupiedSlugs}
                    onChange={setField("roomSlug")}
                    rooms={rooms}
                    selectedSlug={state.roomSlug}
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

            {isExternalBooker(state.bookerType) && (
                <label className="group flex max-w-3xl cursor-pointer items-start gap-3">
                    <CheckboxSquare
                        checked={state.flexibleDates}
                        onChange={setField("flexibleDates")}
                    />
                    <span className="text-sm leading-6 text-foreground/80">
                        Dato og rom er fleksibelt. Kvarteret kan foreslå et annet tidspunkt eller
                        rom hvis dette passer bedre.
                    </span>
                </label>
            )}

            {selectedRoomTitle && state.startDate && (
                <RoomAvailability
                    bookings={roomBookings}
                    hasConflict={hasConflict}
                    roomTitle={selectedRoomTitle}
                />
            )}
        </section>
    )
}

// — 03 —
export function EventDetailsSection({ state, setField, uid }: SectionProps) {
    return (
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
    )
}

// — 04 —
export function NeedsSection({ state, setField, uid }: SectionProps) {
    return (
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
                    icon={Volume2}
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
                                onChange={e => setField("micQuantity")(Number(e.target.value) || 1)}
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
                <TechnicianOption
                    checked={state.soundTech}
                    label="Dedikert lydtekniker"
                    onChange={setField("soundTech")}
                />
                <TechnicianOption
                    checked={state.lightTech}
                    label="Dedikert lystekniker"
                    onChange={setField("lightTech")}
                />
            </div>
            <FieldHint>
                Sendes til Crescat som teknisk utstyr: {composeTechEquipment(state)}
            </FieldHint>
        </section>
    )
}

// — 05 —
export function CateringBarSection({ state, setField, uid }: SectionProps) {
    const cateringSummary = composeCatering(state)
    return (
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
                    <FieldHint>Pris: 2000 kr eks. mva. Forutsetter kapasitet.</FieldHint>
                </ToggleOption>
                {cateringSummary && (
                    <p className="whitespace-pre-line border-l-2 border-border pl-4 text-sm leading-6 text-foreground/70">
                        {cateringSummary}
                    </p>
                )}
            </div>
        </section>
    )
}

// — 06 —
export function TicketSection({ state, setField, uid }: SectionProps) {
    return (
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
    )
}

// — 07 —
export function ContactSection({ state, setField, uid }: SectionProps) {
    const isExternal = isExternalBooker(state.bookerType)
    return (
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
    )
}

// — 08 —
export function TermsSection({ state, setField }: SectionProps) {
    const [hasRead, setHasRead] = useState(false)

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const el = event.currentTarget
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setHasRead(true)
    }

    return (
        <section className="space-y-4">
            <SectionHeader number="08" title="Vilkår" />
            <div
                className="max-w-3xl space-y-3 overflow-y-auto border-2 border-border bg-card p-4 text-sm leading-6 text-foreground/75"
                onScroll={handleScroll}
                style={{ maxHeight: "12rem" }}
            >
                <p>
                    Ved å booke et lokale på Det Akademiske Kvarter inngår du en forespørsel som må
                    godkjennes av en romkoordinator. En booking er ikke bekreftet før du har mottatt
                    bekreftelse på e-post.
                </p>
                <p>
                    Ekstratjenester som teknikere, catering og bar kommer som betalte tillegg og
                    avtales i etterkant. Eksterne arrangører faktureres etter gjeldende priser.
                </p>
                <p>
                    Avbestilling må skje i henhold til våre avbestillingsvilkår. Sen avbestilling
                    kan medføre gebyr.
                </p>
                <p className="flex flex-wrap gap-4">
                    <a
                        className="font-heading underline underline-offset-4"
                        href={TERMS_URL}
                        rel="noreferrer"
                        target="_blank"
                    >
                        Vilkår for leie
                    </a>
                    <a
                        className="font-heading underline underline-offset-4"
                        href={CANCELLATION_URL}
                        rel="noreferrer"
                        target="_blank"
                    >
                        Avbestillingsvilkår
                    </a>
                </p>
                <p className="text-xs text-foreground/45">Bla til bunnen for å bekrefte.</p>
            </div>
            <label
                className={cn(
                    "group flex max-w-3xl items-start gap-3",
                    hasRead ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                )}
            >
                <CheckboxSquare
                    checked={state.acceptTerms}
                    onChange={value => hasRead && setField("acceptTerms")(value)}
                />
                <span className="text-sm leading-6 text-foreground/80">
                    Jeg har lest, forstått og godkjenner Det Akademiske Kvarters bookingvilkår.
                </span>
            </label>
        </section>
    )
}

// ——— leaves ———

interface SelectableCardProps {
    selected: boolean
    onSelect: () => void
    disabled?: boolean
    children: ReactNode
    className?: string
}

// Standardized clickable card used by the booker-type and option grids.
function SelectableCard({
    selected,
    onSelect,
    disabled,
    children,
    className,
}: SelectableCardProps) {
    return (
        <button
            aria-pressed={selected}
            className={cn(
                "flex min-h-32 cursor-pointer flex-col gap-2 border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                disabled && "cursor-not-allowed opacity-45 hover:bg-transparent",
                className,
            )}
            disabled={disabled}
            onClick={onSelect}
            type="button"
        >
            {children}
        </button>
    )
}

interface RoomPickerProps {
    rooms: BookingRoom[]
    selectedSlug: string
    occupiedSlugs: Set<string>
    onChange: (slug: string) => void
}

function RoomPicker({ rooms, selectedSlug, occupiedSlugs, onChange }: RoomPickerProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map(room => {
                const selected = selectedSlug === room.slug
                const occupied = occupiedSlugs.has(room.slug)
                return (
                    <button
                        aria-pressed={selected}
                        className={cn(
                            "group cursor-pointer overflow-hidden border-2 bg-card text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected ? "border-primary" : "border-border hover:border-primary",
                            occupied && "cursor-not-allowed opacity-45 hover:border-border",
                        )}
                        disabled={occupied}
                        key={room.slug}
                        onClick={() => onChange(room.slug)}
                        type="button"
                    >
                        <div className="relative aspect-[16/9] bg-muted">
                            {room.image?.assetUrl ? (
                                <Image
                                    alt={room.image.alt ?? room.title ?? room.slug}
                                    className="object-cover"
                                    fill
                                    sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 100vw"
                                    src={room.image.assetUrl}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-foreground/30">
                                    <Building2 aria-hidden className="size-8" />
                                </div>
                            )}
                            {selected && !occupied && (
                                <span className="absolute right-3 top-3 flex size-7 items-center justify-center bg-primary text-primary-foreground">
                                    <Check aria-hidden className="size-4" />
                                </span>
                            )}
                            {occupied && (
                                <span className="absolute left-3 top-3 bg-foreground px-2 py-1 font-heading text-xs uppercase tracking-wide text-background">
                                    Opptatt
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
                "border-2 transition-colors",
                checked ? "border-primary bg-primary/5" : "border-border bg-card",
            )}
        >
            <button
                aria-pressed={checked}
                className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
                onClick={() => onChange(!checked)}
                type="button"
            >
                <CheckboxSquare checked={checked} onChange={onChange} />
                <span className="flex min-w-0 flex-1 items-center gap-2 font-heading text-sm text-foreground">
                    <Icon aria-hidden className="size-4 text-primary" />
                    {label}
                </span>
            </button>
            {children && <div className="px-4 pb-4">{children}</div>}
        </div>
    )
}

interface TechnicianOptionProps {
    checked: boolean
    label: string
    onChange: (checked: boolean) => void
}

function TechnicianOption({ checked, label, onChange }: TechnicianOptionProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 border-2 p-4 transition-colors",
                checked ? "border-primary bg-primary/5" : "border-border bg-card",
            )}
        >
            <button
                aria-pressed={checked}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                onClick={() => onChange(!checked)}
                type="button"
            >
                <CheckboxSquare checked={checked} onChange={onChange} />
                <span className="flex min-w-0 items-center gap-2 font-heading text-sm text-foreground">
                    <Wand2 aria-hidden className="size-4 text-primary" />
                    {label}
                </span>
            </button>
            <Popover>
                <PopoverTrigger
                    aria-label={`Info om ${label}`}
                    className="cursor-pointer text-foreground/50 hover:text-foreground"
                >
                    <Info aria-hidden className="size-4" />
                </PopoverTrigger>
                <PopoverContent className="w-72 text-sm leading-6">
                    Dedikert tekniker koster <strong>3500 kr eks. mva</strong> per tekniker.
                    Avbestilling må skje senest <strong>10 dager</strong> før arrangementet.
                </PopoverContent>
            </Popover>
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
        <Card
            className={cn(
                "max-w-3xl gap-2 p-4",
                hasConflict && "border-destructive bg-destructive/10",
            )}
        >
            <p className="flex items-center gap-2 font-heading text-sm text-foreground">
                <CalendarClock aria-hidden className="size-4 text-primary" />
                {roomTitle} – opptatt denne dagen
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
        </Card>
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

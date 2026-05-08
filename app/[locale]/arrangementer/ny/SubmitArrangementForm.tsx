"use client"

import {
    CalendarPlus,
    Check,
    ChevronDown,
    ImageIcon,
    Loader2,
    Plus,
    Trash2,
    Upload,
    X,
} from "lucide-react"
import { useCallback, useEffect, useId, useMemo, useReducer, useState, useTransition } from "react"
import { submitArrangement, uploadEventImage } from "@/app/actions/submit-arrangement"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ArrangementEventType, ArrangementGroup, ArrangementRoom } from "@/lib/sanity/queries"
import { cn } from "@/lib/utils"
import type { ArrangementSummary } from "../ArrangementCard"
import { ArrangementCard } from "../ArrangementCard"
import { RecurrenceBuilder } from "./RecurrenceBuilder"

// ─── Types ────────────────────────────────────────────────────────────────────

type DateEntry = { id: string; startDate: string; startTime: string; endTime: string }

type FormState = {
    title: string
    description: string
    dates: DateEntry[]
    isRecurring: boolean
    rrule: string
    room: string
    roomText: string
    organizerGroup: string
    organizerText: string
    submittedByOrganization: string
    eventTypeId: string
    isFree: boolean
    priceOrdinar: string
    priceStudent: string
    priceMedlem: string
    ticketUrl: string
    facebookUrl: string
    submittedBy: string
    submittedByEmail: string
}

type Action =
    | { type: "SET"; key: keyof FormState; value: string | boolean }
    | { type: "ADD_DATE" }
    | { type: "REMOVE_DATE"; id: string }
    | { type: "UPDATE_DATE"; id: string; key: keyof DateEntry; value: string }

const newDate = (): DateEntry => ({
    id: Math.random().toString(36).slice(2),
    startDate: "",
    startTime: "",
    endTime: "",
})

const initialState: FormState = {
    title: "",
    description: "",
    dates: [newDate()],
    isRecurring: false,
    rrule: "",
    room: "",
    roomText: "",
    organizerGroup: "",
    organizerText: "",
    submittedByOrganization: "",
    eventTypeId: "",
    isFree: false,
    priceOrdinar: "",
    priceStudent: "",
    priceMedlem: "",
    ticketUrl: "",
    facebookUrl: "",
    submittedBy: "",
    submittedByEmail: "",
}

function reducer(state: FormState, action: Action): FormState {
    switch (action.type) {
        case "SET":
            return { ...state, [action.key]: action.value }
        case "ADD_DATE":
            return { ...state, dates: [...state.dates, newDate()] }
        case "REMOVE_DATE":
            return { ...state, dates: state.dates.filter(d => d.id !== action.id) }
        case "UPDATE_DATE":
            return {
                ...state,
                dates: state.dates.map(d =>
                    d.id === action.id ? { ...d, [action.key]: action.value } : d,
                ),
            }
        default:
            return state
    }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ number, title }: { number: string; title: string }) {
    return (
        <div className="flex items-baseline gap-4 border-b-2 border-border pb-4">
            <span className="font-heading text-4xl text-primary leading-none">{number}</span>
            <h2 className="font-heading text-xl uppercase tracking-[0.15em] text-foreground">
                {title}
            </h2>
        </div>
    )
}

function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("space-y-2", className)}>{children}</div>
}

function FieldHint({ children }: { children: React.ReactNode }) {
    return <p className="text-xs text-foreground/55">{children}</p>
}

function SelectField({
    id,
    label,
    value,
    onChange,
    options,
    placeholder,
    hint,
}: {
    id: string
    label: string
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
    placeholder?: string
    hint?: string
}) {
    return (
        <FieldGroup>
            <Label htmlFor={id}>{label}</Label>
            {hint && <FieldHint>{hint}</FieldHint>}
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full appearance-none border-2 border-border bg-background px-3 py-2 pr-9 text-sm font-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map(o => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/50"
                    aria-hidden
                />
            </div>
        </FieldGroup>
    )
}

function PriceInput({
    id,
    label,
    value,
    onChange,
}: {
    id: string
    label: string
    value: string
    onChange: (v: string) => void
}) {
    return (
        <FieldGroup>
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/50">
                    kr
                </span>
                <Input
                    id={id}
                    type="number"
                    min={0}
                    step={1}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="0"
                    className="pl-9"
                />
            </div>
        </FieldGroup>
    )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface SubmitArrangementFormProps {
    rooms: ArrangementRoom[]
    eventTypes: ArrangementEventType[]
    groups: ArrangementGroup[]
}

type SubmitStatus = "idle" | "success" | "error"

export function SubmitArrangementForm({ rooms, eventTypes, groups }: SubmitArrangementFormProps) {
    const [state, dispatch] = useReducer(reducer, initialState)
    const [isPending, startTransition] = useTransition()
    const [submitStatus, setSubmitStatus] = useReducer(
        (_: SubmitStatus, next: SubmitStatus) => next,
        "idle",
    )
    const [errorMessage, setErrorMessage] = useReducer((_: string, next: string) => next, "")
    const uid = useId()

    // ── Image state
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
    const [imageAssetId, setImageAssetId] = useState<string | null>(null)
    const [imageUploading, setImageUploading] = useState(false)
    const [imageUploadError, setImageUploadError] = useState("")

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
        }
    }, [imagePreviewUrl])

    const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setImagePreviewUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return url
        })
        setImageAssetId(null)
        setImageUploadError("")
        setImageUploading(true)
        const fd = new FormData()
        fd.append("image", file)
        const result = await uploadEventImage(fd)
        setImageUploading(false)
        if (result.ok) {
            setImageAssetId(result.assetId)
        } else {
            setImageUploadError(result.error)
        }
    }, [])

    const handleRemoveImage = useCallback(() => {
        setImagePreviewUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return null
        })
        setImageAssetId(null)
        setImageUploadError("")
    }, [])

    const set = useCallback(
        (key: keyof FormState) => (value: string | boolean) =>
            dispatch({ type: "SET", key, value }),
        [],
    )

    const setRrule = useCallback(
        (rrule: string) => dispatch({ type: "SET", key: "rrule", value: rrule }),
        [],
    )

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!state.title.trim() || !state.submittedBy.trim() || !state.submittedByEmail.trim())
            return
        if (state.dates.every(d => !d.startDate)) return
        if (imageUploading) return

        startTransition(async () => {
            const result = await submitArrangement({
                title: state.title,
                description: state.description || undefined,
                dates: state.dates
                    .filter(d => d.startDate)
                    .map(d => ({
                        startDate: d.startDate,
                        startTime: d.startTime || undefined,
                        endTime: d.endTime || undefined,
                    })),
                isRecurring: state.isRecurring,
                rrule: state.isRecurring ? state.rrule : undefined,
                room: state.room || undefined,
                roomText: state.roomText || undefined,
                organizerGroup: state.organizerGroup || undefined,
                organizerText: state.organizerText || undefined,
                submittedByOrganization: state.submittedByOrganization || undefined,
                eventTypeId: state.eventTypeId || undefined,
                imageAssetId: imageAssetId || undefined,
                isFree: state.isFree,
                priceOrdinar: state.priceOrdinar ? Number(state.priceOrdinar) : undefined,
                priceStudent: state.priceStudent ? Number(state.priceStudent) : undefined,
                priceMedlem: state.priceMedlem ? Number(state.priceMedlem) : undefined,
                ticketUrl: state.ticketUrl || undefined,
                facebookUrl: state.facebookUrl || undefined,
                submittedBy: state.submittedBy,
                submittedByEmail: state.submittedByEmail,
            })

            if (result.ok) {
                setSubmitStatus("success")
            } else {
                setSubmitStatus("error")
                setErrorMessage(result.error)
            }
        })
    }

    // ── Preview data derived from form state
    const previewArrangement = useMemo((): ArrangementSummary => {
        const selectedRoom = rooms.find(r => r._id === state.room)
        const selectedGroup = groups.find(g => g._id === state.organizerGroup)
        const selectedEventType = eventTypes.find(et => et._id === state.eventTypeId)

        return {
            _id: "preview",
            title: state.title.trim() || "Arrangementstittelen",
            slug: "preview",
            isRecurring: state.isRecurring,
            dates: state.dates
                .filter(d => d.startDate)
                .map(d => ({
                    _key: d.id,
                    startDate: d.startDate,
                    startTime: d.startTime || null,
                    endTime: d.endTime || null,
                })),
            isFree: state.isFree,
            priceOrdinar: state.priceOrdinar ? Number(state.priceOrdinar) : null,
            priceStudent: state.priceStudent ? Number(state.priceStudent) : null,
            priceMedlem: state.priceMedlem ? Number(state.priceMedlem) : null,
            ticketUrl: state.ticketUrl || null,
            facebookUrl: state.facebookUrl || null,
            imageUrl: imagePreviewUrl,
            imageCaption: null,
            room: selectedRoom
                ? { _id: selectedRoom._id, title: selectedRoom.title, slug: "" }
                : null,
            roomText: state.roomText || null,
            organizerGroup: selectedGroup
                ? { _id: selectedGroup._id, name: selectedGroup.name, slug: "" }
                : null,
            organizerText: state.organizerText || null,
            eventType: selectedEventType
                ? {
                      _id: selectedEventType._id,
                      name: selectedEventType.name,
                      taxonomyGroup: selectedEventType.taxonomyGroup
                          ? {
                                _id: selectedEventType.taxonomyGroup._id,
                                name: selectedEventType.taxonomyGroup.name,
                            }
                          : null,
                  }
                : null,
        }
    }, [state, imagePreviewUrl, rooms, groups, eventTypes])

    // ── Options
    const eventTypeOptions = eventTypes.map(et => ({
        value: et._id,
        label: et.taxonomyGroup ? `${et.taxonomyGroup.name} — ${et.name}` : et.name,
    }))
    const roomOptions = rooms.map(r => ({ value: r._id, label: r.title }))
    const groupOptions = groups.map(g => ({ value: g._id, label: g.name }))

    if (submitStatus === "success") {
        return <p className="font-heading text-green-600">yey</p>
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-12 items-start">
            {/* ── Form ─────────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate className="space-y-14 min-w-0">
                {/* ── 01. Grunninfo ──────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionHeader number="01" title="Om arrangementet" />

                    <FieldGroup>
                        <Label htmlFor={`${uid}-title`}>Tittel *</Label>
                        <Input
                            id={`${uid}-title`}
                            value={state.title}
                            onChange={e => set("title")(e.target.value)}
                            placeholder="Navn på arrangementet"
                            required
                            autoComplete="off"
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <Label htmlFor={`${uid}-description`}>Beskrivelse</Label>
                        <FieldHint>
                            Fortell gjerne om hva som skjer, hvem som opptrer, og hva folk kan vente
                            seg.
                        </FieldHint>
                        <textarea
                            id={`${uid}-description`}
                            value={state.description}
                            onChange={e => set("description")(e.target.value)}
                            rows={5}
                            placeholder="Beskriv arrangementet…"
                            className="w-full border-2 border-border bg-background px-3 py-2 text-sm font-base text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                        />
                    </FieldGroup>

                    <SelectField
                        id={`${uid}-eventType`}
                        label="Arrangementstype"
                        value={state.eventTypeId}
                        onChange={set("eventTypeId")}
                        options={eventTypeOptions}
                        placeholder="Velg type (valgfritt)"
                    />
                </section>

                {/* ── 02. Bilde ──────────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionHeader number="02" title="Bilde" />

                    <FieldGroup>
                        <FieldHint>
                            JPEG, PNG eller WebP — maks 8 MB. Vises i listinga og på
                            arrangementssiden.
                        </FieldHint>

                        {imagePreviewUrl ? (
                            <div className="space-y-3">
                                <div className="relative aspect-[16/9] w-full overflow-hidden border-2 border-border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imagePreviewUrl}
                                        alt="Forhåndsvisning av opplastet bilde"
                                        className="h-full w-full object-cover"
                                    />
                                    {imageUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                                            <Loader2 className="size-6 animate-spin text-primary" />
                                        </div>
                                    )}
                                    {imageAssetId && !imageUploading && (
                                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-background/90 px-2 py-1 text-xs text-foreground/70">
                                            <Check className="size-3 text-primary" aria-hidden />
                                            Lastet opp
                                        </div>
                                    )}
                                </div>
                                {imageUploadError && (
                                    <p className="text-xs text-destructive">{imageUploadError}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="size-3" aria-hidden />
                                    Fjern bilde
                                </button>
                            </div>
                        ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed border-border px-4 py-10 transition-colors hover:border-primary hover:bg-muted/40">
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    onChange={handleImageChange}
                                />
                                <Upload className="size-7 text-foreground/30" aria-hidden />
                                <span className="text-sm text-foreground/50">
                                    Klikk for å velge bilde
                                </span>
                            </label>
                        )}
                    </FieldGroup>
                </section>

                {/* ── 03. Dato og tid ────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionHeader number="03" title="Dato og tid" />

                    <div className="space-y-4">
                        {state.dates.map((date, index) => (
                            <div
                                key={date.id}
                                className="border-2 border-border bg-card p-4 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="font-heading text-sm uppercase tracking-[0.12em] text-foreground/60">
                                        Dato {state.dates.length > 1 ? index + 1 : ""}
                                    </p>
                                    {state.dates.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                dispatch({ type: "REMOVE_DATE", id: date.id })
                                            }
                                            className="text-foreground/40 hover:text-destructive transition-colors"
                                            aria-label="Fjern dato"
                                        >
                                            <X className="size-4" aria-hidden />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <FieldGroup>
                                        <Label htmlFor={`${uid}-date-${date.id}`}>Dato *</Label>
                                        <Input
                                            id={`${uid}-date-${date.id}`}
                                            type="date"
                                            value={date.startDate}
                                            onChange={e =>
                                                dispatch({
                                                    type: "UPDATE_DATE",
                                                    id: date.id,
                                                    key: "startDate",
                                                    value: e.target.value,
                                                })
                                            }
                                            required={index === 0}
                                        />
                                    </FieldGroup>

                                    <FieldGroup>
                                        <Label htmlFor={`${uid}-starttime-${date.id}`}>
                                            Starttid
                                            <span className="ml-1 text-foreground/40 font-sans font-normal">
                                                (anbefalt)
                                            </span>
                                        </Label>
                                        <Input
                                            id={`${uid}-starttime-${date.id}`}
                                            type="time"
                                            value={date.startTime}
                                            onChange={e =>
                                                dispatch({
                                                    type: "UPDATE_DATE",
                                                    id: date.id,
                                                    key: "startTime",
                                                    value: e.target.value,
                                                })
                                            }
                                        />
                                    </FieldGroup>

                                    <FieldGroup>
                                        <Label htmlFor={`${uid}-endtime-${date.id}`}>
                                            Sluttid
                                            <span className="ml-1 text-foreground/40 font-sans font-normal">
                                                (valgfritt)
                                            </span>
                                        </Label>
                                        <Input
                                            id={`${uid}-endtime-${date.id}`}
                                            type="time"
                                            value={date.endTime}
                                            onChange={e =>
                                                dispatch({
                                                    type: "UPDATE_DATE",
                                                    id: date.id,
                                                    key: "endTime",
                                                    value: e.target.value,
                                                })
                                            }
                                        />
                                    </FieldGroup>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => dispatch({ type: "ADD_DATE" })}
                            className="flex items-center gap-2 border-2 border-dashed border-border px-4 py-2.5 text-sm font-heading text-foreground/60 hover:border-primary hover:text-primary transition-colors w-full justify-center"
                        >
                            <Plus className="size-4" aria-hidden />
                            Legg til dato
                        </button>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={state.isRecurring}
                                    onChange={e => set("isRecurring")(e.target.checked)}
                                    className="sr-only"
                                />
                                <div
                                    className={cn(
                                        "size-5 border-2 border-border flex items-center justify-center transition-colors",
                                        state.isRecurring
                                            ? "bg-primary"
                                            : "bg-background group-hover:bg-muted",
                                    )}
                                >
                                    {state.isRecurring && (
                                        <Check
                                            className="size-3 text-primary-foreground"
                                            aria-hidden
                                        />
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="font-heading text-sm text-foreground">
                                    Gjentagende arrangement
                                </p>
                                <p className="text-xs text-foreground/55 mt-0.5">
                                    Arrangementet gjentas etter et fast mønster (f.eks. ukentlig
                                    quiz, månedlig konsert)
                                </p>
                            </div>
                        </label>

                        {state.isRecurring && <RecurrenceBuilder onChange={setRrule} />}
                    </div>
                </section>

                {/* ── 04. Sted ───────────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionHeader number="04" title="Sted" />

                    <SelectField
                        id={`${uid}-room`}
                        label="Rom på Kvarteret"
                        value={state.room}
                        onChange={set("room")}
                        options={roomOptions}
                        placeholder="Velg rom (valgfritt)"
                        hint="Velg rommet om arrangementet er i et av Kvarterets lokaler."
                    />

                    <FieldGroup>
                        <Label htmlFor={`${uid}-roomText`}>Alternativt sted</Label>
                        <FieldHint>
                            Bruk dette feltet om stedet ikke er i lista, f.eks. «Uteområdet» eller
                            «Storstuen, 3. etasje».
                        </FieldHint>
                        <Input
                            id={`${uid}-roomText`}
                            value={state.roomText}
                            onChange={e => set("roomText")(e.target.value)}
                            placeholder="Fritekst"
                        />
                    </FieldGroup>
                </section>

                {/* ── 05. Arrangør ───────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionHeader number="05" title="Arrangør" />

                    <SelectField
                        id={`${uid}-organizerGroup`}
                        label="Gruppe på Kvarteret"
                        value={state.organizerGroup}
                        onChange={set("organizerGroup")}
                        options={groupOptions}
                        placeholder="Velg gruppe (valgfritt)"
                        hint="Om din gruppe er registrert på Kvarteret, velg den her."
                    />

                    <FieldGroup>
                        <Label htmlFor={`${uid}-organizerText`}>Arrangørnavn (fritekst)</Label>
                        <FieldHint>
                            Bruk dette om dere ikke er i lista — f.eks. «Bandet Skumringen»,
                            «Fagutvalget ved MN».
                        </FieldHint>
                        <Input
                            id={`${uid}-organizerText`}
                            value={state.organizerText}
                            onChange={e => set("organizerText")(e.target.value)}
                            placeholder="Arrangørens navn"
                        />
                    </FieldGroup>
                </section>

                {/* ── 06. Pris ───────────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionHeader number="06" title="Pris" />

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={state.isFree}
                                onChange={e => set("isFree")(e.target.checked)}
                                className="sr-only"
                            />
                            <div
                                className={cn(
                                    "size-5 border-2 border-border flex items-center justify-center transition-colors",
                                    state.isFree
                                        ? "bg-primary"
                                        : "bg-background group-hover:bg-muted",
                                )}
                            >
                                {state.isFree && (
                                    <Check className="size-3 text-primary-foreground" aria-hidden />
                                )}
                            </div>
                        </div>
                        <span className="font-heading text-sm text-foreground">Gratis inngang</span>
                    </label>

                    {!state.isFree && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <PriceInput
                                id={`${uid}-priceOrdinar`}
                                label="Ordinær"
                                value={state.priceOrdinar}
                                onChange={set("priceOrdinar")}
                            />
                            <PriceInput
                                id={`${uid}-priceStudent`}
                                label="Student"
                                value={state.priceStudent}
                                onChange={set("priceStudent")}
                            />
                            <PriceInput
                                id={`${uid}-priceMedlem`}
                                label="Medlem"
                                value={state.priceMedlem}
                                onChange={set("priceMedlem")}
                            />
                        </div>
                    )}

                    <FieldHint>
                        Alle prisfelt er valgfrie. La dem stå tomme om du er usikker — vi tar gjerne
                        kontakt for avklaring.
                    </FieldHint>
                </section>

                {/* ── 07. Lenker ─────────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionHeader number="07" title="Lenker" />

                    <FieldGroup>
                        <Label htmlFor={`${uid}-ticketUrl`}>Billettlenke</Label>
                        <Input
                            id={`${uid}-ticketUrl`}
                            type="url"
                            value={state.ticketUrl}
                            onChange={e => set("ticketUrl")(e.target.value)}
                            placeholder="https://ticketmaster.no/..."
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <Label htmlFor={`${uid}-facebookUrl`}>Facebook-arrangement</Label>
                        <Input
                            id={`${uid}-facebookUrl`}
                            type="url"
                            value={state.facebookUrl}
                            onChange={e => set("facebookUrl")(e.target.value)}
                            placeholder="https://facebook.com/events/..."
                        />
                    </FieldGroup>
                </section>

                {/* ── 08. Kontaktinformasjon ─────────────────────────────── */}
                <section className="space-y-6">
                    <SectionHeader number="08" title="Kontaktinformasjon" />

                    <p className="text-sm text-foreground/60 leading-6">
                        Vi trenger en kontaktperson for arrangementet. Informasjonen vises ikke
                        offentlig — den brukes bare av Kvarterets PR-gruppe til å følge opp
                        innmeldingen.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldGroup>
                            <Label htmlFor={`${uid}-submittedBy`}>Ditt navn *</Label>
                            <Input
                                id={`${uid}-submittedBy`}
                                value={state.submittedBy}
                                onChange={e => set("submittedBy")(e.target.value)}
                                placeholder="Fullt navn"
                                required
                                autoComplete="name"
                            />
                        </FieldGroup>

                        <FieldGroup>
                            <Label htmlFor={`${uid}-submittedByEmail`}>E-postadresse *</Label>
                            <Input
                                id={`${uid}-submittedByEmail`}
                                type="email"
                                value={state.submittedByEmail}
                                onChange={e => set("submittedByEmail")(e.target.value)}
                                placeholder="epost@eksempel.no"
                                required
                                autoComplete="email"
                            />
                        </FieldGroup>
                    </div>

                    <FieldGroup>
                        <Label htmlFor={`${uid}-org`}>Organisasjon / gruppe</Label>
                        <Input
                            id={`${uid}-org`}
                            value={state.submittedByOrganization}
                            onChange={e => set("submittedByOrganization")(e.target.value)}
                            placeholder="F.eks. Bandet Skumringen, Realfagskollegiet"
                        />
                    </FieldGroup>
                </section>

                {/* ── Submit ─────────────────────────────────────────────── */}
                <section className="space-y-4 border-t-2 border-border pt-8">
                    {submitStatus === "error" && (
                        <div className="border-2 border-destructive bg-destructive/10 px-4 py-3 flex items-start gap-3">
                            <X className="size-4 mt-0.5 shrink-0 text-destructive" aria-hidden />
                            <div>
                                <p className="text-sm font-heading text-destructive">
                                    Det oppstod en feil
                                </p>
                                <p className="text-sm text-foreground/70 mt-0.5">{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-foreground/60 leading-6">
                        Arrangementet sendes til godkjenning hos PR-gruppen på Kvarteret. Det vil
                        ikke vises på nettsiden før det er godkjent. Vi tar vanligvis 1–3
                        virkedager.
                    </p>

                    <Button
                        type="submit"
                        disabled={isPending || imageUploading}
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="animate-spin" aria-hidden />
                                Sender inn…
                            </>
                        ) : imageUploading ? (
                            <>
                                <Loader2 className="animate-spin" aria-hidden />
                                Laster opp bilde…
                            </>
                        ) : (
                            <>
                                <CalendarPlus aria-hidden />
                                Send inn arrangement
                            </>
                        )}
                    </Button>
                </section>
            </form>

            {/* ── Preview panel ─────────────────────────────────────────────── */}
            <div className="hidden xl:block sticky top-8 space-y-3" aria-hidden>
                <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/50">
                    Forhåndsvisning
                </p>
                <div className="pointer-events-none select-none">
                    <ArrangementCard
                        arrangement={previewArrangement}
                        locale="nb"
                        facebookLabel="Facebook"
                        ticketsLabel="Billetter"
                    />
                </div>
                <p className="text-xs text-foreground/40 text-center">
                    Slik vil arrangementet se ut i listen
                </p>
            </div>
        </div>
    )
}

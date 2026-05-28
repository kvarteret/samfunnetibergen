"use client"

import { CalendarPlus, Check, Loader2, Plus, Trash2, Upload, X } from "lucide-react"
import type { ChangeEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type {
    DateEntry,
    SelectOption,
    SetFormField,
    SubmitStatus,
    UpdateDateField,
} from "../domain/formState"
import { EventCard, type EventSummary } from "./EventCard"
import {
    CheckboxSquare,
    FieldGroup,
    FieldHint,
    PriceInput,
    SectionHeader,
    SelectField,
} from "./FormFields"
import { RecurrenceBuilder } from "./RecurrenceBuilder"

interface EventDetailsFieldsProps {
    uid: string
    title: string
    description: string
    eventTypeId: string
    eventTypeOptions: SelectOption[]
    isInternalEvent: boolean
    setField: SetFormField
}

export function EventDetailsFields({
    uid,
    title,
    description,
    eventTypeId,
    eventTypeOptions,
    isInternalEvent,
    setField,
}: EventDetailsFieldsProps) {
    return (
        <section className="space-y-6">
            <SectionHeader number="01" title="Om arrangementet" />

            <FieldGroup>
                <Label htmlFor={`${uid}-title`}>Tittel *</Label>
                <Input
                    autoComplete="off"
                    id={`${uid}-title`}
                    onChange={event => setField("title")(event.target.value)}
                    placeholder="Navn på arrangementet"
                    required
                    value={title}
                />
            </FieldGroup>

            <FieldGroup>
                <Label htmlFor={`${uid}-description`}>Beskrivelse</Label>
                <FieldHint>
                    Fortell gjerne om hva som skjer, hvem som opptrer, og hva folk kan vente seg.
                </FieldHint>
                <textarea
                    className="w-full resize-y border-2 border-border bg-background px-3 py-2 text-sm font-base text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    id={`${uid}-description`}
                    onChange={event => setField("description")(event.target.value)}
                    placeholder="Beskriv arrangementet..."
                    rows={5}
                    value={description}
                />
            </FieldGroup>

            <SelectField
                id={`${uid}-eventType`}
                label="Arrangementstype"
                onChange={setField("eventTypeId")}
                options={eventTypeOptions}
                placeholder="Velg type (valgfritt)"
                value={eventTypeId}
            />

            <label className="group flex cursor-pointer items-start gap-3">
                <CheckboxSquare checked={isInternalEvent} onChange={setField("isInternalEvent")} />
                <span>
                    <span className="block font-heading text-sm text-foreground">
                        Internarrangement
                    </span>
                    <span className="mt-0.5 block text-xs text-foreground/55">
                        Arrangementet er kun tilgjengelig for frivillige.
                    </span>
                </span>
            </label>
        </section>
    )
}

interface EventImageFieldProps {
    imageAssetId: string | null
    imagePreviewUrl: string | null
    imageUploading: boolean
    imageUploadError: string
    onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
    onRemoveImage: () => void
}

export function EventImageField({
    imageAssetId,
    imagePreviewUrl,
    imageUploading,
    imageUploadError,
    onImageChange,
    onRemoveImage,
}: EventImageFieldProps) {
    return (
        <section className="space-y-6">
            <SectionHeader number="02" title="Bilde" />

            <FieldGroup>
                <FieldHint>
                    JPEG, PNG eller WebP - maks 8 MB. Vises i listinga og på arrangementssiden.
                </FieldHint>

                {imagePreviewUrl ? (
                    <UploadedImagePreview
                        imageAssetId={imageAssetId}
                        imagePreviewUrl={imagePreviewUrl}
                        imageUploading={imageUploading}
                        imageUploadError={imageUploadError}
                        onRemoveImage={onRemoveImage}
                    />
                ) : (
                    <ImageUploadDropzone onImageChange={onImageChange} />
                )}
            </FieldGroup>
        </section>
    )
}

interface UploadedImagePreviewProps {
    imageAssetId: string | null
    imagePreviewUrl: string
    imageUploading: boolean
    imageUploadError: string
    onRemoveImage: () => void
}

function UploadedImagePreview({
    imageAssetId,
    imagePreviewUrl,
    imageUploading,
    imageUploadError,
    onRemoveImage,
}: UploadedImagePreviewProps) {
    return (
        <div className="space-y-3">
            <div className="relative aspect-[16/9] w-full overflow-hidden border-2 border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt="Forhåndsvisning av opplastet bilde"
                    className="h-full w-full object-cover"
                    src={imagePreviewUrl}
                />
                {imageUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                        <Loader2 className="size-6 animate-spin text-primary" />
                    </div>
                )}
                {imageAssetId && !imageUploading && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-background/90 px-2 py-1 text-xs text-foreground/70">
                        <Check aria-hidden className="size-3 text-primary" />
                        Lastet opp
                    </div>
                )}
            </div>
            {imageUploadError && <p className="text-xs text-destructive">{imageUploadError}</p>}
            <button
                className="flex items-center gap-1.5 text-xs text-foreground/50 transition-colors hover:text-destructive"
                onClick={onRemoveImage}
                type="button"
            >
                <Trash2 aria-hidden className="size-3" />
                Fjern bilde
            </button>
        </div>
    )
}

interface ImageUploadDropzoneProps {
    onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
}

function ImageUploadDropzone({ onImageChange }: ImageUploadDropzoneProps) {
    return (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed border-border px-4 py-10 transition-colors hover:border-primary hover:bg-muted/40">
            <input
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={onImageChange}
                type="file"
            />
            <Upload aria-hidden className="size-7 text-foreground/30" />
            <span className="text-sm text-foreground/50">Klikk for å velge bilde</span>
        </label>
    )
}

interface EventScheduleFieldsProps {
    uid: string
    dates: DateEntry[]
    isRecurring: boolean
    addDate: () => void
    removeDate: (id: string) => void
    setField: SetFormField
    setRrule: (rrule: string) => void
    updateDate: UpdateDateField
}

export function EventScheduleFields({
    uid,
    dates,
    isRecurring,
    addDate,
    removeDate,
    setField,
    setRrule,
    updateDate,
}: EventScheduleFieldsProps) {
    return (
        <section className="space-y-6">
            <SectionHeader number="03" title="Dato og tid" />

            <div className="space-y-4">
                {dates.map((date, index) => (
                    <EventDateCard
                        date={date}
                        index={index}
                        key={date.id}
                        totalDates={dates.length}
                        uid={uid}
                        removeDate={removeDate}
                        updateDate={updateDate}
                    />
                ))}

                <button
                    className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-border px-4 py-2.5 text-sm font-heading text-foreground/60 transition-colors hover:border-primary hover:text-primary"
                    onClick={addDate}
                    type="button"
                >
                    <Plus aria-hidden className="size-4" />
                    Legg til dato
                </button>
            </div>

            <EventRecurrenceFields
                isRecurring={isRecurring}
                onRecurrenceChange={setRrule}
                onRecurringToggle={setField("isRecurring")}
            />
        </section>
    )
}

interface EventDateCardProps {
    uid: string
    date: DateEntry
    index: number
    totalDates: number
    removeDate: (id: string) => void
    updateDate: UpdateDateField
}

function EventDateCard({
    uid,
    date,
    index,
    totalDates,
    removeDate,
    updateDate,
}: EventDateCardProps) {
    return (
        <div className="space-y-4 border-2 border-border bg-card p-4">
            <div className="flex items-center justify-between">
                <p className="font-heading text-sm uppercase tracking-[0.12em] text-foreground/60">
                    Dato {totalDates > 1 ? index + 1 : ""}
                </p>
                {totalDates > 1 && (
                    <button
                        aria-label="Fjern dato"
                        className="text-foreground/40 transition-colors hover:text-destructive"
                        onClick={() => removeDate(date.id)}
                        type="button"
                    >
                        <X aria-hidden className="size-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FieldGroup>
                    <Label htmlFor={`${uid}-date-${date.id}`}>Dato *</Label>
                    <Input
                        id={`${uid}-date-${date.id}`}
                        onChange={event => updateDate(date.id, "startDate", event.target.value)}
                        required={index === 0}
                        type="date"
                        value={date.startDate}
                    />
                </FieldGroup>

                <FieldGroup>
                    <Label htmlFor={`${uid}-starttime-${date.id}`}>
                        Starttid
                        <span className="ml-1 font-sans font-normal text-foreground/40">
                            (anbefalt)
                        </span>
                    </Label>
                    <Input
                        id={`${uid}-starttime-${date.id}`}
                        onChange={event => updateDate(date.id, "startTime", event.target.value)}
                        type="time"
                        value={date.startTime}
                    />
                </FieldGroup>

                <FieldGroup>
                    <Label htmlFor={`${uid}-endtime-${date.id}`}>
                        Sluttid
                        <span className="ml-1 font-sans font-normal text-foreground/40">
                            (valgfritt)
                        </span>
                    </Label>
                    <Input
                        id={`${uid}-endtime-${date.id}`}
                        onChange={event => updateDate(date.id, "endTime", event.target.value)}
                        type="time"
                        value={date.endTime}
                    />
                </FieldGroup>
            </div>
        </div>
    )
}

interface EventRecurrenceFieldsProps {
    isRecurring: boolean
    onRecurrenceChange: (rrule: string) => void
    onRecurringToggle: (isRecurring: boolean) => void
}

function EventRecurrenceFields({
    isRecurring,
    onRecurrenceChange,
    onRecurringToggle,
}: EventRecurrenceFieldsProps) {
    return (
        <div className="space-y-4">
            <label className="group flex cursor-pointer items-start gap-3">
                <CheckboxSquare checked={isRecurring} onChange={onRecurringToggle} />
                <span>
                    <span className="block font-heading text-sm text-foreground">
                        Gjentagende arrangement
                    </span>
                    <span className="mt-0.5 block text-xs text-foreground/55">
                        Arrangementet gjentas etter et fast mønster (f.eks. ukentlig quiz, månedlig
                        konsert)
                    </span>
                </span>
            </label>

            {isRecurring && <RecurrenceBuilder onChange={onRecurrenceChange} />}
        </div>
    )
}

interface EventPlaceFieldsProps {
    uid: string
    room: string
    roomText: string
    roomOptions: SelectOption[]
    setField: SetFormField
}

export function EventPlaceFields({
    uid,
    room,
    roomText,
    roomOptions,
    setField,
}: EventPlaceFieldsProps) {
    return (
        <section className="space-y-6">
            <SectionHeader number="04" title="Sted" />

            <SelectField
                hint="Velg rommet om arrangementet er i et av Kvarterets lokaler."
                id={`${uid}-room`}
                label="Rom på Kvarteret"
                onChange={setField("room")}
                options={roomOptions}
                placeholder="Velg rom (valgfritt)"
                value={room}
            />

            <FieldGroup>
                <Label htmlFor={`${uid}-roomText`}>Alternativt sted</Label>
                <FieldHint>
                    Bruk dette feltet om stedet ikke er i lista, f.eks. &quot;Uteområdet&quot; eller
                    &quot;Storstuen, 3. etasje&quot;.
                </FieldHint>
                <Input
                    id={`${uid}-roomText`}
                    onChange={event => setField("roomText")(event.target.value)}
                    placeholder="Fritekst"
                    value={roomText}
                />
            </FieldGroup>
        </section>
    )
}

interface EventOrganizerFieldsProps {
    uid: string
    organizerGroup: string
    organizerText: string
    groupOptions: SelectOption[]
    setField: SetFormField
}

export function EventOrganizerFields({
    uid,
    organizerGroup,
    organizerText,
    groupOptions,
    setField,
}: EventOrganizerFieldsProps) {
    return (
        <section className="space-y-6">
            <SectionHeader number="05" title="Arrangør" />

            <SelectField
                hint="Om din gruppe er registrert på Kvarteret, velg den her."
                id={`${uid}-organizerGroup`}
                label="Gruppe på Kvarteret"
                onChange={setField("organizerGroup")}
                options={groupOptions}
                placeholder="Velg gruppe (valgfritt)"
                value={organizerGroup}
            />

            <FieldGroup>
                <Label htmlFor={`${uid}-organizerText`}>Arrangørnavn (fritekst)</Label>
                <FieldHint>
                    Bruk dette om dere ikke er i lista - f.eks. &quot;Bandet Skumringen&quot;,
                    &quot;Fagutvalget ved MN&quot;.
                </FieldHint>
                <Input
                    id={`${uid}-organizerText`}
                    onChange={event => setField("organizerText")(event.target.value)}
                    placeholder="Arrangørens navn"
                    value={organizerText}
                />
            </FieldGroup>
        </section>
    )
}

interface EventPriceFieldsProps {
    uid: string
    isFree: boolean
    priceOrdinar: string
    priceStudent: string
    priceMedlem: string
    setField: SetFormField
}

export function EventPriceFields({
    uid,
    isFree,
    priceOrdinar,
    priceStudent,
    priceMedlem,
    setField,
}: EventPriceFieldsProps) {
    return (
        <section className="space-y-6">
            <SectionHeader number="06" title="Pris" />

            <label className="group flex cursor-pointer items-center gap-3">
                <CheckboxSquare checked={isFree} onChange={setField("isFree")} />
                <span className="font-heading text-sm text-foreground">Gratis inngang</span>
            </label>

            {!isFree && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <PriceInput
                        id={`${uid}-priceOrdinar`}
                        label="Ordinær"
                        onChange={setField("priceOrdinar")}
                        value={priceOrdinar}
                    />
                    <PriceInput
                        id={`${uid}-priceStudent`}
                        label="Student"
                        onChange={setField("priceStudent")}
                        value={priceStudent}
                    />
                    <PriceInput
                        id={`${uid}-priceMedlem`}
                        label="Medlem"
                        onChange={setField("priceMedlem")}
                        value={priceMedlem}
                    />
                </div>
            )}

            <FieldHint>
                Alle prisfelt er valgfrie. La dem stå tomme om du er usikker - vi tar gjerne kontakt
                for avklaring.
            </FieldHint>
        </section>
    )
}

interface EventLinksFieldsProps {
    uid: string
    ticketUrl: string
    facebookUrl: string
    setField: SetFormField
}

export function EventLinksFields({ uid, ticketUrl, facebookUrl, setField }: EventLinksFieldsProps) {
    return (
        <section className="space-y-6">
            <SectionHeader number="07" title="Lenker" />

            <FieldGroup>
                <Label htmlFor={`${uid}-ticketUrl`}>Billettlenke</Label>
                <Input
                    id={`${uid}-ticketUrl`}
                    onChange={event => setField("ticketUrl")(event.target.value)}
                    placeholder="https://ticketmaster.no/..."
                    type="url"
                    value={ticketUrl}
                />
            </FieldGroup>

            <FieldGroup>
                <Label htmlFor={`${uid}-facebookUrl`}>Facebook-arrangement</Label>
                <Input
                    id={`${uid}-facebookUrl`}
                    onChange={event => setField("facebookUrl")(event.target.value)}
                    placeholder="https://facebook.com/events/..."
                    type="url"
                    value={facebookUrl}
                />
            </FieldGroup>
        </section>
    )
}

interface SubmitterFieldsProps {
    uid: string
    submittedBy: string
    submittedByEmail: string
    submittedByOrganization: string
    setField: SetFormField
}

export function SubmitterFields({
    uid,
    submittedBy,
    submittedByEmail,
    submittedByOrganization,
    setField,
}: SubmitterFieldsProps) {
    return (
        <section className="space-y-6">
            <SectionHeader number="08" title="Kontaktinformasjon" />

            <p className="text-sm leading-6 text-foreground/60">
                Vi trenger en kontaktperson for arrangementet. Informasjonen vises ikke offentlig -
                den brukes bare av Kvarterets PR-gruppe til å følge opp innmeldingen.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldGroup>
                    <Label htmlFor={`${uid}-submittedBy`}>Ditt navn *</Label>
                    <Input
                        autoComplete="name"
                        id={`${uid}-submittedBy`}
                        onChange={event => setField("submittedBy")(event.target.value)}
                        placeholder="Fullt navn"
                        required
                        value={submittedBy}
                    />
                </FieldGroup>

                <FieldGroup>
                    <Label htmlFor={`${uid}-submittedByEmail`}>E-postadresse *</Label>
                    <Input
                        autoComplete="email"
                        id={`${uid}-submittedByEmail`}
                        onChange={event => setField("submittedByEmail")(event.target.value)}
                        placeholder="epost@eksempel.no"
                        required
                        type="email"
                        value={submittedByEmail}
                    />
                </FieldGroup>
            </div>

            <FieldGroup>
                <Label htmlFor={`${uid}-org`}>Organisasjon / gruppe</Label>
                <Input
                    id={`${uid}-org`}
                    onChange={event => setField("submittedByOrganization")(event.target.value)}
                    placeholder="F.eks. Bandet Skumringen, Realfagskollegiet"
                    value={submittedByOrganization}
                />
            </FieldGroup>
        </section>
    )
}

interface SubmitEventActionsProps {
    errorMessage: string
    imageUploading: boolean
    isPending: boolean
    submitStatus: SubmitStatus
}

export function SubmitEventActions({
    errorMessage,
    imageUploading,
    isPending,
    submitStatus,
}: SubmitEventActionsProps) {
    return (
        <section className="space-y-4 border-t-2 border-border pt-8">
            {submitStatus === "error" && (
                <div className="flex items-start gap-3 border-2 border-destructive bg-destructive/10 px-4 py-3">
                    <X aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <div>
                        <p className="text-sm font-heading text-destructive">Det oppstod en feil</p>
                        <p className="mt-0.5 text-sm text-foreground/70">{errorMessage}</p>
                    </div>
                </div>
            )}

            <p className="text-sm leading-6 text-foreground/60">
                Arrangementet sendes til godkjenning hos PR-gruppen på Kvarteret. Det vil ikke vises
                på nettsiden før det er godkjent. Vi tar vanligvis 1-3 virkedager.
            </p>

            <Button
                className="w-full sm:w-auto"
                disabled={isPending || imageUploading}
                size="lg"
                type="submit"
            >
                {isPending ? (
                    <>
                        <Loader2 aria-hidden className="animate-spin" />
                        Sender inn...
                    </>
                ) : imageUploading ? (
                    <>
                        <Loader2 aria-hidden className="animate-spin" />
                        Laster opp bilde...
                    </>
                ) : (
                    <>
                        <CalendarPlus aria-hidden />
                        Send inn arrangement
                    </>
                )}
            </Button>
        </section>
    )
}

interface EventListPreviewProps {
    event: EventSummary
}

export function EventListPreview({ event }: EventListPreviewProps) {
    return (
        <div aria-hidden className="sticky top-8 hidden space-y-3 xl:block">
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/50">
                Forhåndsvisning
            </p>
            <div className="pointer-events-none select-none">
                <EventCard
                    event={event}
                    facebookLabel="Facebook"
                    locale="nb"
                    ticketsLabel="Billetter"
                />
            </div>
            <p className="text-center text-xs text-foreground/40">
                Slik vil arrangementet se ut i listen
            </p>
        </div>
    )
}

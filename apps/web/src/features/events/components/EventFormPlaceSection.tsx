"use client"

import { useStore, type AnyFieldApi } from "@tanstack/react-form"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField, type SelectOption } from "@/components/ui/select-field"
import { useEventForm } from "./eventFormContext"

interface EventFormPlaceSectionProps {
  uid: string
  roomOptions: SelectOption[]
  roomTextEnglishError?: string
  roomTextError?: string
  number?: string
}

export function EventFormPlaceSection({
  uid,
  roomOptions,
  roomTextEnglishError,
  roomTextError,
  number = "04",
}: EventFormPlaceSectionProps) {
  const form = useEventForm()
  const roomTextId = `${uid}-roomText`
  const roomTextErrorId = `${roomTextId}-error`
  const roomTextEnglishId = `${uid}-roomText-en`
  const roomTextEnglishErrorId = `${roomTextEnglishId}-error`
  const hasRoomText = useStore(
    form.store,
    state => state.values.roomText.trim().length > 0,
  )

  return (
    <FormSection number={number} title="Sted">
      <form.Field name="room">
        {(field: AnyFieldApi) => (
          <SelectField
            hint="Velg rommet om arrangementet er i et av Kvarterets lokaler."
            id={`${uid}-room`}
            label="Rom på Kvarteret"
            onChange={field.handleChange}
            options={roomOptions}
            placeholder="Velg rom (valgfritt)"
            value={field.state.value as string}
          />
        )}
      </form.Field>

      <FieldGroup error={roomTextError} errorId={roomTextErrorId}>
        <Label htmlFor={roomTextId}>Alternativt sted (norsk)</Label>
        <FieldHint>
          Bruk dette feltet om stedet ikke er i lista, f.eks.
          &quot;Uteområdet&quot; eller &quot;Storstuen, 3. etasje&quot;. For
          arrangementer utenfor Kvarteret, ta med full gateadresse.
        </FieldHint>
        <form.Field name="roomText">
          {(field: AnyFieldApi) => (
            <Input
              aria-describedby={roomTextError ? roomTextErrorId : undefined}
              aria-invalid={!!roomTextError}
              id={roomTextId}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="Stedsnavn, og gateadresse utenfor Kvarteret"
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>

      <FieldGroup error={roomTextEnglishError} errorId={roomTextEnglishErrorId}>
        <Label htmlFor={roomTextEnglishId}>Alternativt sted (engelsk)</Label>
        <FieldHint>
          Påkrevd hvis du fyller ut et alternativt sted på norsk.
        </FieldHint>
        <form.Field name="roomTextEnglish">
          {(field: AnyFieldApi) => (
            <Input
              aria-describedby={
                roomTextEnglishError ? roomTextEnglishErrorId : undefined
              }
              aria-invalid={!!roomTextEnglishError}
              id={roomTextEnglishId}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="Location name and full address"
              required={hasRoomText}
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>
    </FormSection>
  )
}

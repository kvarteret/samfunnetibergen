"use client"

import { Trash2 } from "lucide-react"
import type { ChangeEvent } from "react"

import { CheckboxField } from "@/components/ui/checkbox-field"
import { FieldError } from "@/components/ui/field-error"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { ImageDropzone } from "@/components/ui/image-dropzone"
import { formatEventImageMaxSize } from "../domain/imageUpload"

interface EventFormImageSectionProps {
  imagePreviewUrl: string | null
  imageUploadError: string
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  number?: string
  // When provided, renders an "upload later" acknowledgement. Used by the
  // booking promotion step, where an image is optional but its absence must be
  // explicitly acknowledged since events are not published without one.
  uploadLater?: boolean
  onUploadLaterChange?: (value: boolean) => void
}

export function EventFormImageSection({
  imagePreviewUrl,
  imageUploadError,
  onImageChange,
  onRemoveImage,
  number = "02",
  uploadLater,
  onUploadLaterChange,
}: EventFormImageSectionProps) {
  return (
    <FormSection number={number} title="Bilde">
      <FieldGroup>
        <FieldHint>
          JPEG, PNG eller WebP - maks {formatEventImageMaxSize()}. Vises i
          listinga og på arrangementssiden. Bildet lastes opp når du sender inn
          skjemaet.
        </FieldHint>

        {imagePreviewUrl ? (
          <UploadedImagePreview
            imagePreviewUrl={imagePreviewUrl}
            imageUploadError={imageUploadError}
            onRemoveImage={onRemoveImage}
          />
        ) : (
          <ImageDropzone onImageChange={onImageChange} />
        )}

        {onUploadLaterChange && !imagePreviewUrl && (
          <CheckboxField
            checked={Boolean(uploadLater)}
            hint="Arrangementer publiseres ikke før de har et bilde."
            label="Jeg laster opp bilde senere"
            onChange={onUploadLaterChange}
          />
        )}
      </FieldGroup>
    </FormSection>
  )
}

interface UploadedImagePreviewProps {
  imagePreviewUrl: string
  imageUploadError: string
  onRemoveImage: () => void
}

function UploadedImagePreview({
  imagePreviewUrl,
  imageUploadError,
  onRemoveImage,
}: UploadedImagePreviewProps) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden border-2 border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Forhåndsvisning av opplastet bilde"
          className="h-full w-full object-cover"
          src={imagePreviewUrl}
        />
      </div>
      {imageUploadError && (
        <FieldError id="event-image-upload-error">
          {imageUploadError}
        </FieldError>
      )}
      <button
        className="flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-destructive"
        onClick={onRemoveImage}
        type="button"
      >
        <Trash2 aria-hidden className="size-3" />
        Fjern bilde
      </button>
    </div>
  )
}

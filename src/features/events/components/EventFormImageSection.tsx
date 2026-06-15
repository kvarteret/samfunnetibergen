"use client"

import { Trash2 } from "lucide-react"
import type { ChangeEvent } from "react"

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
}

export function EventFormImageSection({
  imagePreviewUrl,
  imageUploadError,
  onImageChange,
  onRemoveImage,
}: EventFormImageSectionProps) {
  return (
    <FormSection number="02" title="Bilde">
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

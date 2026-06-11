"use client"

import { Check, Loader2, Trash2 } from "lucide-react"
import type { ChangeEvent } from "react"

import { FieldError } from "@/components/ui/field-error"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { ImageDropzone } from "@/components/ui/image-dropzone"
import { formatEventImageMaxSize } from "../domain/imageUpload"

interface EventFormImageSectionProps {
  imageAssetId: string | null
  imagePreviewUrl: string | null
  imageUploading: boolean
  imageUploadError: string
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
}

export function EventFormImageSection({
  imageAssetId,
  imagePreviewUrl,
  imageUploading,
  imageUploadError,
  onImageChange,
  onRemoveImage,
}: EventFormImageSectionProps) {
  return (
    <FormSection number="02" title="Bilde">
      <FieldGroup>
        <FieldHint>
          JPEG, PNG eller WebP - maks {formatEventImageMaxSize()}. Vises i
          listinga og på arrangementssiden.
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
          <ImageDropzone onImageChange={onImageChange} />
        )}
      </FieldGroup>
    </FormSection>
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
      <div className="relative aspect-video w-full overflow-hidden border-2 border-border">
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
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-background/90 px-2 py-1 text-xs text-foreground-muted">
            <Check aria-hidden className="size-3 text-primary" />
            Lastet opp
          </div>
        )}
      </div>
      {imageUploadError && (
        <FieldError id="event-image-upload-error">
          {imageUploadError}
        </FieldError>
      )}
      <button
        className="flex items-center gap-1.5 text-xs text-foreground-muted transition-colors hover:text-destructive"
        onClick={onRemoveImage}
        type="button"
      >
        <Trash2 aria-hidden className="size-3" />
        Fjern bilde
      </button>
    </div>
  )
}

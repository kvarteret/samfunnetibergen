"use client"

import { Dialog } from "@base-ui/react/dialog"
import { Crop, Trash2, X } from "lucide-react"
import { type ChangeEvent, useState } from "react"
import Cropper from "react-easy-crop"

import { CheckboxField } from "@/components/ui/checkbox-field"
import { FieldError } from "@/components/ui/field-error"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { ImageDropzone } from "@/components/ui/image-dropzone"
import { cropFromPercent, type EventImageCrop } from "../domain/eventImage"
import { formatEventImageMaxSize } from "../domain/imageUpload"
import { EventImageFrame } from "./EventImageFrame"

interface EventFormImageSectionProps {
  imagePreviewUrl: string | null
  imageUploadError: string
  crop?: EventImageCrop | null
  focus?: { x: number; y: number }
  onCropChange?: (crop: EventImageCrop) => void
  onFocusChange?: (focus: { x: number; y: number }) => void
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
  crop,
  focus,
  onCropChange,
  onFocusChange,
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
          Bildet vises i 16:9, helst 1600 × 900 piksler. Velg utsnitt og
          fokuspunkt i bilderedigeringen. Hold viktig tekst og logo innenfor
          rammen. JPEG, PNG eller WebP - maks {formatEventImageMaxSize()}.
          Bildet lastes opp når du sender inn skjemaet.
        </FieldHint>

        {imagePreviewUrl ? (
          <UploadedImagePreview
            imagePreviewUrl={imagePreviewUrl}
            imageUploadError={imageUploadError}
            crop={crop}
            focus={focus}
            onCropChange={onCropChange}
            onFocusChange={onFocusChange}
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
  crop?: EventImageCrop | null
  focus?: { x: number; y: number }
  onCropChange?: (crop: EventImageCrop) => void
  onFocusChange?: (focus: { x: number; y: number }) => void
  onRemoveImage: () => void
}

function UploadedImagePreview({
  imagePreviewUrl,
  imageUploadError,
  crop,
  focus,
  onCropChange,
  onFocusChange,
  onRemoveImage,
}: UploadedImagePreviewProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [open, setOpen] = useState(true)
  const showEditor = Boolean(onCropChange && onFocusChange && focus)

  return (
    <div className="space-y-3">
      <EventImageFrame
        alt="Forhåndsvisning av opplastet bilde"
        className="border-2 border-border"
        previewCrop={crop}
        sizes="(max-width: 1280px) 100vw, 50vw"
        src={imagePreviewUrl}
      />
      <p className="text-sm text-foreground-muted">
        Slik vises bildet i 16:9 på arrangementskort og arrangementssider.
      </p>
      {showEditor && (
        <Dialog.Root onOpenChange={setOpen} open={open}>
          <Dialog.Trigger className="inline-flex items-center gap-2 border-2 border-border bg-background px-4 py-2 font-heading text-sm uppercase tracking-widest focus-brutal">
            <Crop aria-hidden className="size-4" />
            Rediger utsnitt og fokus
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-100 bg-black/70" />
            <Dialog.Popup className="fixed left-1/2 top-1/2 z-100 flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col border-2 border-border bg-background shadow-shadow">
              <div className="flex shrink-0 items-center justify-between border-b-2 border-border p-4">
                <Dialog.Title className="font-heading text-xl">
                  Rediger utsnitt og fokus
                </Dialog.Title>
                <Dialog.Close
                  aria-label="Lukk bilderedigering"
                  className="p-1 text-foreground-muted hover:text-foreground focus-brutal"
                >
                  <X aria-hidden className="size-5" />
                </Dialog.Close>
              </div>
              <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
                <Dialog.Description className="text-sm text-foreground-muted">
                  Dra og zoom bildet for å velge utsnittet som vises i 16:9.
                </Dialog.Description>
                <div className="relative h-64 overflow-hidden border-2 border-border bg-muted sm:h-[min(50vh,28rem)]">
                  <Cropper
                    aspect={16 / 9}
                    crop={position}
                    image={imagePreviewUrl}
                    onCropChange={setPosition}
                    onCropComplete={area =>
                      onCropChange?.(cropFromPercent(area))
                    }
                    onZoomChange={setZoom}
                    zoom={zoom}
                  />
                </div>
                <label
                  className="block text-sm font-medium"
                  htmlFor="event-image-zoom"
                >
                  Zoom
                </label>
                <input
                  className="w-full accent-primary"
                  id="event-image-zoom"
                  max="3"
                  min="1"
                  onChange={event => setZoom(Number(event.target.value))}
                  step="0.01"
                  type="range"
                  value={zoom}
                />
                <p className="text-sm text-foreground-muted">
                  Klikk i forhåndsvisningen for å plassere fokuspunktet for
                  andre bildeformater.
                </p>
                <div className="relative mx-auto w-full max-w-xl">
                  <EventImageFrame
                    alt="Valgt bildeutsnitt"
                    className="border-2 border-border"
                    previewCrop={crop}
                    sizes="(max-width: 640px) 100vw, 36rem"
                    src={imagePreviewUrl}
                  />
                  {focus && (
                    <button
                      aria-label="Velg fokuspunkt i bildet"
                      className="absolute inset-0 cursor-crosshair focus-brutal"
                      onClick={event => {
                        const bounds =
                          event.currentTarget.getBoundingClientRect()
                        const clamp = (value: number) =>
                          Math.min(0.98, Math.max(0.02, value))
                        onFocusChange?.({
                          x: clamp(
                            (event.clientX - bounds.left) / bounds.width,
                          ),
                          y: clamp(
                            (event.clientY - bounds.top) / bounds.height,
                          ),
                        })
                      }}
                      onKeyDown={event => {
                        const delta = 0.05
                        const next = { ...focus }
                        if (event.key === "ArrowLeft") next.x -= delta
                        else if (event.key === "ArrowRight") next.x += delta
                        else if (event.key === "ArrowUp") next.y -= delta
                        else if (event.key === "ArrowDown") next.y += delta
                        else return
                        event.preventDefault()
                        onFocusChange?.({
                          x: Math.min(0.98, Math.max(0.02, next.x)),
                          y: Math.min(0.98, Math.max(0.02, next.y)),
                        })
                      }}
                      type="button"
                    >
                      <span
                        className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary/50 shadow-md"
                        style={{
                          left: `${focus.x * 100}%`,
                          top: `${focus.y * 100}%`,
                        }}
                      />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-end border-t-2 border-border p-4">
                <Dialog.Close className="bg-primary px-5 py-2 font-heading text-primary-foreground focus-brutal">
                  Ferdig
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
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

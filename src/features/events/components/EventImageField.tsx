"use client";

import { Check, Loader2, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";

import { FieldGroup, FieldHint, SectionHeader } from "@/components/ui/form-fields";
import { formatEventImageMaxSize } from "../domain/imageUpload";

interface EventImageFieldProps {
  imageAssetId: string | null;
  imagePreviewUrl: string | null;
  imageUploading: boolean;
  imageUploadError: string;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
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
          <ImageUploadDropzone onImageChange={onImageChange} />
        )}
      </FieldGroup>
    </section>
  );
}

interface UploadedImagePreviewProps {
  imageAssetId: string | null;
  imagePreviewUrl: string;
  imageUploading: boolean;
  imageUploadError: string;
  onRemoveImage: () => void;
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
      {imageUploadError && (
        <p className="text-xs text-destructive">{imageUploadError}</p>
      )}
      <button
        className="flex items-center gap-1.5 text-xs text-foreground/50 transition-colors hover:text-destructive"
        onClick={onRemoveImage}
        type="button"
      >
        <Trash2 aria-hidden className="size-3" />
        Fjern bilde
      </button>
    </div>
  );
}

interface ImageUploadDropzoneProps {
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
      <span className="text-sm text-foreground/50">
        Klikk for å velge bilde
      </span>
    </label>
  );
}

import { Upload } from "lucide-react"
import type { ChangeEvent } from "react"

interface ImageDropzoneProps {
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
  accept?: string
  label?: string
}

export function ImageDropzone({
  onImageChange,
  accept = "image/jpeg,image/png,image/webp",
  label = "Klikk for å velge bilde",
}: ImageDropzoneProps) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed border-border bg-card px-4 py-10 transition-colors hover:border-primary hover:bg-muted/40 focus-within-brutal">
      <input
        accept={accept}
        className="sr-only"
        onChange={onImageChange}
        type="file"
      />
      <Upload aria-hidden className="size-7 text-foreground-muted" />
      <span className=" text-foreground-muted">{label}</span>
    </label>
  )
}

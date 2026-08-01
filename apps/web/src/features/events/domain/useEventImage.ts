"use client"

import { type ChangeEvent, useCallback, useEffect, useState } from "react"

import {
  EVENT_IMAGE_MAX_SIZE_BYTES,
  formatEventImageMaxSize,
  isAcceptedEventImageType,
} from "./imageUpload"

export interface EventImageController {
  imageFile: File | null
  imagePreviewUrl: string | null
  imageUploadError: string
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  reset: () => void
}

// Owns the client-side image selection lifecycle for event submissions:
// validation (type + size), a revocable object URL for preview, and cleanup.
// Shared by the standalone event form and the booking promotion step so the
// two never drift on accepted formats or size limits.
export function useEventImage(): EventImageController {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUploadError, setImageUploadError] = useState("")

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  const onImageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setImageUploadError("")
    event.target.value = ""

    if (!isAcceptedEventImageType(file.type)) {
      setImageUploadError("Bildet må være JPEG, PNG eller WebP")
      return
    }

    if (file.size > EVENT_IMAGE_MAX_SIZE_BYTES) {
      setImageUploadError(
        `Bildet er for stort (maks ${formatEventImageMaxSize()})`,
      )
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImagePreviewUrl(previousUrl => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
      return previewUrl
    })
    setImageFile(file)
  }, [])

  const onRemoveImage = useCallback(() => {
    setImagePreviewUrl(previousUrl => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
      return null
    })
    setImageFile(null)
    setImageUploadError("")
  }, [])

  return {
    imageFile,
    imagePreviewUrl,
    imageUploadError,
    onImageChange,
    onRemoveImage,
    reset: onRemoveImage,
  }
}

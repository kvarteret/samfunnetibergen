import type { Metadata } from "next"

type PageMetadataOptions = {
  canonicalPath: string
  fallbackTitle: string
  fallbackDescription?: string | null
  fallbackImageUrl?: string | null
}

export function buildPageMetadata({
  canonicalPath,
  fallbackTitle,
  fallbackDescription,
  fallbackImageUrl,
}: PageMetadataOptions): Metadata {
  const description = fallbackDescription ?? undefined
  const imageUrl = fallbackImageUrl ?? undefined

  return {
    title: `${fallbackTitle} | Samfunnet i Bergen`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: fallbackTitle,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  }
}

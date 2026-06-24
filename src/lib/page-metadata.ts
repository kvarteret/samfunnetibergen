import type { Metadata } from "next"

type SeoContent = {
  seoTitle?: string | null
  seoDescription?: string | null
  canonicalUrl?: string | null
  noIndex?: boolean | null
  noFollow?: boolean | null
  openGraphTitle?: string | null
  openGraphDescription?: string | null
  openGraphImageUrl?: string | null
  openGraphImageAlt?: string | null
}

type PageMetadataOptions = {
  content: SeoContent | null | undefined
  canonicalPath: string
  fallbackTitle: string
  fallbackDescription?: string | null
  fallbackImageUrl?: string | null
}

export function buildPageMetadata({
  content,
  canonicalPath,
  fallbackTitle,
  fallbackDescription,
  fallbackImageUrl,
}: PageMetadataOptions): Metadata {
  const title = content?.seoTitle ?? fallbackTitle
  const description =
    content?.seoDescription ?? fallbackDescription ?? undefined
  const imageUrl = content?.openGraphImageUrl ?? fallbackImageUrl ?? undefined

  return {
    title: `${title} | Samfunnet i Bergen`,
    description,
    alternates: {
      canonical: content?.canonicalUrl ?? canonicalPath,
    },
    robots: {
      index: !content?.noIndex,
      follow: !content?.noFollow,
    },
    openGraph: {
      title: content?.openGraphTitle ?? title,
      description: content?.openGraphDescription ?? description,
      images: imageUrl
        ? [{ url: imageUrl, alt: content?.openGraphImageAlt ?? undefined }]
        : undefined,
    },
  }
}

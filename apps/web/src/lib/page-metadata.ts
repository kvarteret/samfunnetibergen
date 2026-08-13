import type { Metadata } from "next"

export const SITE_NAME = "Samfunnet i Bergen"
export const DEFAULT_SOCIAL_IMAGE_PATH = "/opengraph-image"
export const DEFAULT_SITE_DESCRIPTION =
  "Opplev arrangementer, rom, grupper og studentkultur på Det Akademiske Kvarter i Bergen."

export type PageMetadataOptions = {
  locale?: "nb" | "en"
  canonicalPath: string
  title: string
  description?: string | null
  imageUrl?: string | null
  openGraphType?: "website" | "article"
}

export function buildPageMetadata({
  locale = "nb",
  canonicalPath,
  title,
  description,
  imageUrl,
  openGraphType = "website",
}: PageMetadataOptions): Metadata {
  const resolvedDescription = description?.trim() || DEFAULT_SITE_DESCRIPTION
  const resolvedImageUrl = imageUrl || DEFAULT_SOCIAL_IMAGE_PATH

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description: resolvedDescription,
      url: canonicalPath,
      siteName: SITE_NAME,
      locale: locale === "en" ? "en_GB" : "nb_NO",
      type: openGraphType,
      images: [{ url: resolvedImageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: resolvedDescription,
      images: [resolvedImageUrl],
    },
  }
}

export function buildRootMetadata(siteUrl: string): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_SITE_DESCRIPTION,
    openGraph: {
      title: SITE_NAME,
      description: DEFAULT_SITE_DESCRIPTION,
      siteName: SITE_NAME,
      locale: "nb_NO",
      type: "website",
      url: siteUrl,
      images: [{ url: DEFAULT_SOCIAL_IMAGE_PATH }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: DEFAULT_SITE_DESCRIPTION,
      images: [DEFAULT_SOCIAL_IMAGE_PATH],
    },
  }
}

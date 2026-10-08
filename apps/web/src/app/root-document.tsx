import type { Metadata } from "next"
import { DM_Mono, DM_Sans, Fraunces } from "next/font/google"
import localFont from "next/font/local"
import { draftMode } from "next/headers"
import Script from "next/script"
import { VisualEditing } from "next-sanity/visual-editing"
import type { ReactNode } from "react"
import { JsonLd } from "@/components/JsonLd"
import { buildRootMetadata } from "@/lib/page-metadata"
import { paperPreferenceScript } from "@/lib/paper-preference"
import { SanityLive } from "@/lib/sanity/fetcher"
import { resolveSiteUrl } from "@/lib/site-url"
import { buildOrganizationWebsiteGraph } from "@/lib/structured-data"
import { themePreferenceScript } from "@/lib/theme-preference"

import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

const hegvalDisplay = localFont({
  variable: "--font-hegval-display",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/The Northern Block Ltd - Hegval Display Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/The Northern Block Ltd - Hegval Display Regular.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/The Northern Block Ltd - Hegval Display Medium.otf",
      weight: "400",
      style: "italic",
    },
  ],
})

export function rootMetadata(): Metadata {
  return buildRootMetadata(resolveSiteUrl())
}

/**
 * The `<html>` document shared by the app's root layouts.
 *
 * `lang` must come from the caller rather than next-intl's `getLocale()`: a
 * root layout above `[locale]` can only resolve the locale from request
 * headers, which opts every route out of static rendering and ISR.
 */
export async function RootDocument({
  children,
  lang,
}: {
  children: ReactNode
  lang: string
}) {
  const { isEnabled: isDraftMode } = await draftMode()
  const siteUrl = resolveSiteUrl()

  return (
    <html
      data-paper="grid"
      data-theme="hs"
      lang={lang}
      className={`${hegvalDisplay.className} ${hegvalDisplay.variable} ${fraunces.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Script id="paper-preference" strategy="beforeInteractive">
          {paperPreferenceScript}
        </Script>
        <Script id="theme-preference" strategy="beforeInteractive">
          {themePreferenceScript}
        </Script>
        <JsonLd data={buildOrganizationWebsiteGraph(siteUrl)} />
        {children}
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}

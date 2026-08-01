import type { Metadata } from "next"
import { DM_Mono, Lora, Source_Serif_4 } from "next/font/google"
import localFont from "next/font/local"
import { draftMode } from "next/headers"
import Script from "next/script"
import { VisualEditing } from "next-sanity/visual-editing"
import { JsonLd } from "@/components/JsonLd"
import { paperPreferenceScript } from "@/lib/paper-preference"
import { SanityLive } from "@/lib/sanity/fetcher"
import { buildRootMetadata } from "@/lib/page-metadata"
import { resolveSiteUrl } from "@/lib/site-url"
import { buildOrganizationWebsiteGraph } from "@/lib/structured-data"
import { themePreferenceScript } from "@/lib/theme-preference"

import "./globals.css"

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-source-serif",
  display: "swap",
})

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
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

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata(resolveSiteUrl())
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { isEnabled: isDraftMode } = await draftMode()
  const siteUrl = resolveSiteUrl()

  return (
    <html
      data-paper="grid"
      data-theme="hs"
      lang="nb"
      className={`${hegvalDisplay.className} ${hegvalDisplay.variable} ${sourceSerif4.variable} ${lora.variable} ${dmMono.variable} h-full antialiased`}
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

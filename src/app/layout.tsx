import type { Metadata } from "next"
import { DM_Mono, Lora, Source_Serif_4 } from "next/font/google"
import localFont from "next/font/local"
import { draftMode } from "next/headers"
import Script from "next/script"
import { VisualEditing } from "next-sanity/visual-editing"
import { CountdownOverlay } from "@/components/CountdownOverlay"
import { paperPreferenceScript } from "@/lib/paper-preference"
import { fetchSiteMetadata } from "@/lib/sanity/fetch"
import { SanityLive } from "@/lib/sanity/fetcher"
import { resolveSiteUrl } from "@/lib/site-url"
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
  const siteMetadata = await fetchSiteMetadata("nb", { stega: false })
  const title =
    siteMetadata?.defaultSeoTitle ??
    siteMetadata?.siteName ??
    "Samfunnet i Bergen"
  const description = siteMetadata?.defaultSeoDescription ?? undefined
  const openGraphTitle = siteMetadata?.defaultOpenGraphTitle ?? title
  const openGraphDescription =
    siteMetadata?.defaultOpenGraphDescription ?? description

  return {
    metadataBase: new URL(resolveSiteUrl()),
    title,
    description,
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      images: siteMetadata?.defaultOpenGraphImageUrl
        ? [{ url: siteMetadata.defaultOpenGraphImageUrl }]
        : undefined,
      siteName: siteMetadata?.siteName ?? "Samfunnet i Bergen",
      type: "website",
    },
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { isEnabled: isDraftMode } = await draftMode()

  return (
    <html
      data-paper="grid"
      data-theme="hs"
      lang="no"
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
        {children}
        <CountdownOverlay />
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}

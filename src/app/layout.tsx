import type { Metadata } from "next"
import { DM_Mono, Instrument_Serif } from "next/font/google"
import localFont from "next/font/local"
import { fetchSiteMetadata } from "@/lib/sanity/fetch"
import { resolveSiteUrl } from "@/lib/site-url"

import "./globals.css"

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

const dmMono = DM_Mono({
    variable: "--font-dm-mono",
    subsets: ["latin"],
    weight: ["400", "500"],
})

const instrumentSerif = Instrument_Serif({
    variable: "--font-instrument-serif",
    subsets: ["latin"],
    weight: ["400"],
    style: ["normal", "italic"],
})

export async function generateMetadata(): Promise<Metadata> {
    const siteMetadata = await fetchSiteMetadata("nb", { stega: false })
    const title = siteMetadata?.defaultSeoTitle ?? siteMetadata?.siteName ?? "Samfunnet i Bergen"
    const description = siteMetadata?.defaultSeoDescription ?? undefined
    const openGraphTitle = siteMetadata?.defaultOpenGraphTitle ?? title
    const openGraphDescription = siteMetadata?.defaultOpenGraphDescription ?? description

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
    return (
        <html
            lang="no"
            className={`${hegvalDisplay.className} ${hegvalDisplay.variable} ${dmMono.variable} ${instrumentSerif.variable} h-full antialiased`}
        >
            <body className="min-h-full">{children}</body>
        </html>
    )
}

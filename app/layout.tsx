import type { Metadata } from "next"
import { DM_Mono, Instrument_Serif, Syne } from "next/font/google"
import "./globals.css"

const syne = Syne({
    variable: "--font-syne",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
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

export const metadata: Metadata = {
    title: "Samfunnet i Bergen",
    description: "Studentenes kulturhus i Bergen.",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="no"
            className={`${syne.variable} ${dmMono.variable} ${instrumentSerif.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">{children}</body>
        </html>
    )
}

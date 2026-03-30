import type { Preview } from "@storybook/nextjs-vite"
import * as React from "react"
import { DM_Mono, Instrument_Serif, Syne } from "next/font/google"

import "../app/globals.css"

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

const preview: Preview = {
    decorators: [
        Story =>
            React.createElement(
                "div",
                {
                    className: `${syne.variable} ${dmMono.variable} ${instrumentSerif.variable} min-h-screen bg-background px-6 py-8 font-sans text-foreground antialiased`,
                },
                React.createElement(Story),
            ),
    ],
    parameters: {
        backgrounds: {
            default: "cream",
            values: [
                { name: "cream", value: "oklch(92% 0.014 87)" },
                { name: "card", value: "oklch(97% 0.005 87)" },
                { name: "navy", value: "oklch(20% 0.050 258)" },
            ],
        },
        controls: {
            expanded: true,
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        layout: "centered",
        options: {
            storySort: {
                order: ["Foundations", "Components"],
            },
        },
        a11y: {
            test: "todo",
        },
    },
}

export default preview

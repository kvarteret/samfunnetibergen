import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"

function Swatch({ label, value, textDark = false }: { label: string; value: string; textDark?: boolean }) {
    return (
        <div className="flex flex-col gap-1">
            <div
                className="h-12 w-full border-2 border-border"
                style={{ background: value }}
            />
            <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
            <span className="font-mono text-[10px] text-muted-foreground/70">{value}</span>
        </div>
    )
}

function ScaleRow({ name, steps }: { name: string; steps: Array<{ stop: string; value: string }> }) {
    return (
        <div className="space-y-2">
            <h3 className="font-heading text-sm uppercase tracking-widest text-foreground/60">{name}</h3>
            <div className="grid grid-cols-11 gap-1">
                {steps.map(({ stop, value }) => (
                    <Swatch key={stop} label={stop} value={value} />
                ))}
            </div>
        </div>
    )
}

function SemanticToken({ name, cssVar }: { name: string; cssVar: string }) {
    return (
        <div className="flex items-center gap-3">
            <div
                className="size-10 shrink-0 border-2 border-border"
                style={{ background: `var(${cssVar})` }}
            />
            <div>
                <div className="font-heading text-sm">{name}</div>
                <div className="font-mono text-xs text-muted-foreground">{cssVar}</div>
            </div>
        </div>
    )
}

// ── Palette data ─────────────────────────────────────────────────────────────

const amberSteps = [
    { stop: "50",  value: "oklch(97% 0.027 56)" },
    { stop: "100", value: "oklch(94% 0.045 56)" },
    { stop: "200", value: "oklch(88% 0.072 56)" },
    { stop: "300", value: "oklch(80% 0.117 56)" },
    { stop: "400", value: "oklch(70% 0.153 56)" },
    { stop: "500", value: "oklch(60% 0.180 56)" },
    { stop: "600", value: "oklch(50% 0.171 56)" },
    { stop: "700", value: "oklch(40% 0.153 56)" },
    { stop: "800", value: "oklch(30% 0.126 56)" },
    { stop: "900", value: "oklch(20% 0.090 56)" },
    { stop: "950", value: "oklch(14% 0.063 56)" },
]

const goldSteps = [
    { stop: "50",  value: "oklch(97% 0.026 65)" },
    { stop: "100", value: "oklch(94% 0.043 65)" },
    { stop: "200", value: "oklch(88% 0.068 65)" },
    { stop: "300", value: "oklch(80% 0.111 65)" },
    { stop: "400", value: "oklch(70% 0.145 65)" },
    { stop: "500", value: "oklch(60% 0.170 65)" },
    { stop: "600", value: "oklch(50% 0.162 65)" },
    { stop: "700", value: "oklch(40% 0.145 65)" },
    { stop: "800", value: "oklch(30% 0.119 65)" },
    { stop: "900", value: "oklch(20% 0.085 65)" },
    { stop: "950", value: "oklch(14% 0.059 65)" },
]

const redSteps = [
    { stop: "50",  value: "oklch(97% 0.033 25)" },
    { stop: "100", value: "oklch(94% 0.055 25)" },
    { stop: "200", value: "oklch(88% 0.088 25)" },
    { stop: "300", value: "oklch(80% 0.143 25)" },
    { stop: "400", value: "oklch(70% 0.187 25)" },
    { stop: "500", value: "oklch(60% 0.220 25)" },
    { stop: "600", value: "oklch(50% 0.209 25)" },
    { stop: "700", value: "oklch(40% 0.187 25)" },
    { stop: "800", value: "oklch(30% 0.154 25)" },
    { stop: "900", value: "oklch(20% 0.110 25)" },
    { stop: "950", value: "oklch(14% 0.077 25)" },
]

const navySteps = [
    { stop: "50",  value: "oklch(97% 0.015 258)" },
    { stop: "100", value: "oklch(94% 0.025 258)" },
    { stop: "200", value: "oklch(88% 0.040 258)" },
    { stop: "300", value: "oklch(80% 0.065 258)" },
    { stop: "400", value: "oklch(70% 0.085 258)" },
    { stop: "500", value: "oklch(60% 0.100 258)" },
    { stop: "600", value: "oklch(50% 0.095 258)" },
    { stop: "700", value: "oklch(40% 0.085 258)" },
    { stop: "800", value: "oklch(30% 0.070 258)" },
    { stop: "900", value: "oklch(20% 0.050 258)" },
    { stop: "950", value: "oklch(14% 0.035 258)" },
]

const creamSteps = [
    { stop: "50",  value: "oklch(99% 0.003 87)" },
    { stop: "100", value: "oklch(97% 0.005 87)" },
    { stop: "200", value: "oklch(94% 0.009 87)" },
    { stop: "300", value: "oklch(92% 0.014 87)" },
    { stop: "400", value: "oklch(88% 0.019 87)" },
    { stop: "500", value: "oklch(80% 0.022 87)" },
    { stop: "600", value: "oklch(70% 0.021 87)" },
    { stop: "700", value: "oklch(55% 0.019 87)" },
    { stop: "800", value: "oklch(40% 0.015 87)" },
    { stop: "900", value: "oklch(25% 0.011 87)" },
    { stop: "950", value: "oklch(15% 0.008 87)" },
]

const semanticTokens = [
    { name: "background",          cssVar: "--background" },
    { name: "foreground",          cssVar: "--foreground" },
    { name: "primary",             cssVar: "--primary" },
    { name: "primary-foreground",  cssVar: "--primary-foreground" },
    { name: "secondary",           cssVar: "--secondary" },
    { name: "secondary-foreground",cssVar: "--secondary-foreground" },
    { name: "accent",              cssVar: "--accent" },
    { name: "accent-foreground",   cssVar: "--accent-foreground" },
    { name: "destructive",         cssVar: "--destructive" },
    { name: "muted",               cssVar: "--muted" },
    { name: "muted-foreground",    cssVar: "--muted-foreground" },
    { name: "card",                cssVar: "--card" },
    { name: "border",              cssVar: "--border" },
    { name: "ring",                cssVar: "--ring" },
]

// ── Component & meta ─────────────────────────────────────────────────────────

function ColorDocs() {
    return (
        <div className="w-full max-w-5xl space-y-12">
            <section className="space-y-6">
                <div>
                    <h2 className="font-heading text-xl">Semantic Tokens</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Role-based tokens that map to palette values. Use these in components.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {semanticTokens.map(t => (
                        <SemanticToken key={t.cssVar} name={t.name} cssVar={t.cssVar} />
                    ))}
                </div>
            </section>

            <section className="space-y-8">
                <div>
                    <h2 className="font-heading text-xl">Palette</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        All colors use OKLCH for perceptual uniformity and P3 gamut boosts on supported displays.
                    </p>
                </div>
                <ScaleRow name="Amber — primary" steps={amberSteps} />
                <ScaleRow name="Gold — accent" steps={goldSteps} />
                <ScaleRow name="Red — destructive" steps={redSteps} />
                <ScaleRow name="Navy — foreground / secondary" steps={navySteps} />
                <ScaleRow name="Cream — background / card" steps={creamSteps} />
            </section>
        </div>
    )
}

const meta = {
    title: "Foundations/Colors",
    component: ColorDocs,
    parameters: {
        layout: "padded",
    },
} satisfies Meta<typeof ColorDocs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

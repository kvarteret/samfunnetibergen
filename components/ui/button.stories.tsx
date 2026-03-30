import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ArrowRight } from "lucide-react"
import { fn } from "storybook/test"

import { Button } from "@/components/ui/button"

const meta = {
    title: "Components/Button",
    component: Button,
    args: {
        children: "Bli frivillig",
        onClick: fn(),
    },
    argTypes: {
        variant: {
            control: "inline-radio",
            options: ["default", "noShadow", "neutral", "reverse"],
        },
        size: {
            control: "inline-radio",
            options: ["default", "sm", "lg", "icon"],
        },
    },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithIcon: Story = {
    args: {
        children: (
            <>
                Les mer
                <ArrowRight />
            </>
        ),
    },
}

export const Neutral: Story = {
    args: {
        children: "Se program",
        variant: "neutral",
    },
}

export const IconOnly: Story = {
    args: {
        "aria-label": "Neste",
        children: <ArrowRight />,
        size: "icon",
    },
}

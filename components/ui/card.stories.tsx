import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type * as React from "react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type CardStoryArgs = React.ComponentProps<typeof Card> & {
    actionLabel: string
    description: string
    footerLabel: string
    showAction: boolean
    showFooter: boolean
    title: string
}

const meta = {
    title: "Components/Card",
    component: Card,
    args: {
        actionLabel: "Søk",
        description: "Bli med og skap aktivitet på Kvarteret.",
        footerLabel: "Les mer",
        showAction: true,
        showFooter: true,
        title: "Frivillig på huset",
    },
    argTypes: {
        actionLabel: {
            control: "text",
        },
        description: {
            control: "text",
        },
        footerLabel: {
            control: "text",
        },
        showAction: {
            control: "boolean",
        },
        showFooter: {
            control: "boolean",
        },
        title: {
            control: "text",
        },
    },
    parameters: {
        layout: "padded",
    },
    render: ({
        actionLabel,
        className,
        description,
        footerLabel,
        showAction,
        showFooter,
        title,
    }) => (
        <Card className={cn("w-[380px] bg-card", className)}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                {showAction ? (
                    <CardAction>
                        <Button size="sm">{actionLabel}</Button>
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p>Jobb med konserter, bar, teknikk eller markedsføring.</p>
                <p>Du får erfaring, fellesskap og gratis adgang på huset.</p>
            </CardContent>
            {showFooter ? (
                <CardFooter className="justify-end border-t-2 border-border">
                    <Button variant="neutral">{footerLabel}</Button>
                </CardFooter>
            ) : null}
        </Card>
    ),
} satisfies Meta<CardStoryArgs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Minimal: Story = {
    args: {
        showAction: false,
        showFooter: false,
        description: "Bli med og skap aktivitet ."
    },
}

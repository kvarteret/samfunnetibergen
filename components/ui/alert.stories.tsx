import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const meta = {
    title: "Components/Alert",
    component: Alert,
    args: {
        variant: "default",
    },
    argTypes: {
        variant: {
            control: "inline-radio",
            options: ["default", "destructive"],
        },
    },
    render: args => (
        <Alert {...args} className="w-[420px]">
            <CircleAlert />
            <AlertTitle>Viktig melding</AlertTitle>
            <AlertDescription>
                Fristen for å søke frivilligopptak er fredag klokken 18:00.
            </AlertDescription>
        </Alert>
    ),
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Destructive: Story = {
    args: {
        variant: "destructive",
    },
}

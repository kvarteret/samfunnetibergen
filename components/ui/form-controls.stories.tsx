import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

function ExampleForm() {
    return (
        <div className="flex w-[420px] flex-col gap-5">
            <div className="grid gap-2">
                <Label htmlFor="name">Navn</Label>
                <Input id="name" placeholder="Skriv navnet ditt" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="message">Hvorfor vil du bli med?</Label>
                <Textarea id="message" placeholder="Fortell kort om deg selv" />
            </div>
            <div className="flex items-center gap-3">
                <Checkbox id="updates" defaultChecked />
                <Label htmlFor="updates">Jeg vil ha informasjon om frivilligopptak</Label>
            </div>
        </div>
    )
}

const meta = {
    title: "Components/Form Controls",
    parameters: {
        layout: "padded",
    },
    render: () => <ExampleForm />,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

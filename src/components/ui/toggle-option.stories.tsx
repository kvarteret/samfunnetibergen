import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { MicVocal } from "lucide-react"
import { expect, fn } from "storybook/test"

import { NumberField } from "./number-field"
import { ToggleOption } from "./toggle-option"

const meta = {
  component: ToggleOption,
  tags: ["ai-generated"],
  args: {
    checked: false,
    icon: MicVocal,
    label: "Mikrofon",
    onChange: fn(),
  },
} satisfies Meta<typeof ToggleOption>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox"))
    await expect(args.onChange).toHaveBeenCalledWith(true, expect.anything())
  },
}

export const CheckedWithDetails: Story = {
  args: {
    checked: true,
    children: (
      <div className="max-w-32 space-y-2">
        <p className="font-heading">Antall</p>
        <NumberField onValueChange={fn()} value={2} />
      </div>
    ),
  },
}

import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { NumberField } from "./number-field"

const meta = {
  component: NumberField,
  tags: ["ai-generated"],
  args: {
    onValueChange: fn(),
    value: 10,
  },
} satisfies Meta<typeof NumberField>

export default meta
type Story = StoryObj<typeof meta>

export const WithControls: Story = {
  args: { max: 20, min: 0 },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Øk" }))
    await expect(args.onValueChange).toHaveBeenCalledWith(11, expect.anything())
  },
}

export const WithoutControls: Story = {
  args: { placeholder: "Antall", showControls: false, value: null },
}

export const Disabled: Story = {
  args: { disabled: true },
}

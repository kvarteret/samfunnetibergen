import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { ToggleGroup } from "./toggle-group"

const meta = {
  component: ToggleGroup,
  tags: ["ai-generated"],
  args: {
    onValueChange: fn(),
    options: [
      { value: "stage", label: "Scene" },
      { value: "sound", label: "Lydanlegg" },
      { value: "lights", label: "Lysrigg" },
    ],
    value: ["stage"],
  },
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Multiple: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Lydanlegg" }))
    await expect(args.onValueChange).toHaveBeenCalled()
  },
}

export const Weekdays: Story = {
  args: {
    options: ["man", "tir", "ons", "tor", "fre", "lør", "søn"].map(day => ({
      label: day,
      value: day,
    })),
    size: "sm",
    value: ["man", "ons"],
  },
}

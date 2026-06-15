import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { SegmentedControl } from "./segmented-control"

const options = [
  { value: "week", label: "Uke" },
  { value: "month", label: "Måned" },
] as const

const meta = {
  component: SegmentedControl,
  tags: ["ai-generated"],
  args: {
    onValueChange: fn(),
    options: [...options],
    value: "week",
  },
} satisfies Meta<typeof SegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

export const Pills: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("radio", { name: "Måned" }))
    await expect(args.onValueChange).toHaveBeenCalledWith(
      "month",
      expect.anything(),
    )
  },
}

export const Squares: Story = {
  args: {
    variant: "squares",
  },
}

export const Fill: Story = {
  args: {
    variant: "fill",
  },
}

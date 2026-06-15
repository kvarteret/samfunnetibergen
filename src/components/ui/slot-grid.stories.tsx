import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { SlotGrid } from "./slot-grid"

const slots = [
  { availability: "available" as const, label: "17:00", value: "17:00" },
  { availability: "taken" as const, label: "18:00", value: "18:00" },
  { availability: "available" as const, label: "19:00", value: "19:00" },
  { availability: "available" as const, label: "20:00", value: "20:00" },
]

const meta = {
  component: SlotGrid,
  tags: ["ai-generated"],
  args: {
    onValueChange: fn(),
    slots,
    value: "17:00",
  },
} satisfies Meta<typeof SlotGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Availability: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole("radio", { name: "18:00" })).toHaveAttribute(
      "aria-disabled",
      "true",
    )
    await userEvent.click(canvas.getByRole("radio", { name: "19:00" }))
    await expect(args.onValueChange).toHaveBeenCalledWith(
      "19:00",
      expect.anything(),
    )
  },
}

export const EmptySelection: Story = {
  args: { label: "Velg tidspunkt", value: null },
}

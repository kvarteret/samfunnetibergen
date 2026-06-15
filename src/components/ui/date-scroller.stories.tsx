import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { DateScroller } from "./date-scroller"

const dates = [
  "2026-06-14",
  "2026-06-15",
  "2026-06-16",
  "2026-06-17",
  "2026-06-18",
]

const meta = {
  component: DateScroller,
  tags: ["ai-generated"],
  args: {
    dates,
    getDateAvailability: (date: string) =>
      date === "2026-06-16" ? "unavailable" : "available",
    onValueChange: fn(),
    selectedDate: "2026-06-14",
    today: "2026-06-14",
  },
} satisfies Meta<typeof DateScroller>

export default meta
type Story = StoryObj<typeof meta>

export const Availability: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("radio", { name: /15/ }))
    await expect(args.onValueChange).toHaveBeenCalledWith(
      "2026-06-15",
      expect.anything(),
    )
    await expect(canvas.getByRole("radio", { name: /16/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    )
  },
}

export const Invalid: Story = {
  args: {
    "aria-describedby": "date-error",
    "aria-invalid": true,
    id: "date-picker",
  },
}

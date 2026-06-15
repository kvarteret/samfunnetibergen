import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import { DateBadges } from "./DateBadges"

const dates = [
  { _key: "first", startDate: "2026-06-14" },
  { _key: "second", startDate: "2026-06-21" },
  { _key: "third", startDate: "2026-06-28" },
  { _key: "fourth", startDate: "2026-07-05" },
  { _key: "fifth", startDate: "2026-07-12" },
]

const meta = {
  component: DateBadges,
  tags: ["ai-generated"],
  args: {
    dates,
    primaryIndex: 0,
  },
} satisfies Meta<typeof DateBadges>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Andre datoer")).toHaveTextContent("+1")
  },
}

export const Small: Story = {
  args: {
    size: "small",
  },
}

export const SingleDate: Story = {
  args: {
    dates: [dates[0]],
  },
}

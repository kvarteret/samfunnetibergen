import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { RoomCapacity } from "./RoomCapacity"

const meta = {
  component: RoomCapacity,
  tags: ["ai-generated"],
} satisfies Meta<typeof RoomCapacity>

export default meta
type Story = StoryObj<typeof meta>

export const StandingAndSeated: Story = {
  args: {
    seated: 80,
    standing: 120,
  },
}

export const StandingOnly: Story = {
  args: {
    standing: 60,
  },
}

export const SeatedOnly: Story = {
  args: {
    seated: 24,
  },
}

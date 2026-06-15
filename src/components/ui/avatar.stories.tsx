import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Avatar } from "./avatar"

const meta = {
  component: Avatar,
  tags: ["ai-generated"],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Initials: Story = {
  args: { alt: "Ada Lovelace", name: "Ada Lovelace" },
}

export const IconFallback: Story = {
  args: { alt: "Ukjent person" },
}

export const CustomSize: Story = {
  args: {
    alt: "Grace Hopper",
    className: "size-20",
    name: "Grace Hopper",
  },
}

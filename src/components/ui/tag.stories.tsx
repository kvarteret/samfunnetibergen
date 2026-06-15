import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Tag } from "./tag"

const meta = {
  component: Tag,
  tags: ["ai-generated"],
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {
  args: {
    children: "Student",
  },
}

export const Success: Story = {
  args: {
    children: "Ledig",
    variant: "success",
  },
}

export const Warning: Story = {
  args: {
    children: "Få plasser",
    variant: "warning",
  },
}

export const Destructive: Story = {
  args: {
    children: "Utsolgt",
    variant: "destructive",
  },
}

export const Outline: Story = {
  args: {
    children: "Arkivert",
    variant: "outline",
  },
}

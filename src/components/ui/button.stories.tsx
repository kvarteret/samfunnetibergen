import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { Button } from "./button"

const meta = {
  component: Button,
  tags: ["ai-generated"],
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: "Send inn",
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Send inn" }))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const Neutral: Story = {
  args: {
    children: "Avbryt",
    variant: "neutral",
  },
}

export const Disabled: Story = {
  args: {
    children: "Ikke tilgjengelig",
    disabled: true,
  },
}

export const CssCheck: Story = {
  args: {
    children: "Kontroller stil",
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Kontroller stil" })
    await expect(getComputedStyle(button).borderTopWidth).toBe("2px")
  },
}

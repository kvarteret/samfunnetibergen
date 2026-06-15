import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { PriceInput } from "./price-input"

const meta = {
  component: PriceInput,
  tags: ["ai-generated"],
  args: {
    id: "ticket-price",
    label: "Pris",
    onChange: fn(),
    value: "150",
  },
} satisfies Meta<typeof PriceInput>

export default meta
type Story = StoryObj<typeof meta>

export const WithValue: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Pris" })).toHaveValue(
      "150",
    )
  },
}

export const Empty: Story = {
  args: { id: "empty-price", value: "" },
}

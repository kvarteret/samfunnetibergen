import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import { Disclosure } from "./disclosure"

const meta = {
  component: Disclosure,
  tags: ["ai-generated"],
  args: {
    children: <p>Her ligger den utdypende informasjonen.</p>,
    summary: "Les mer",
  },
} satisfies Meta<typeof Disclosure>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Les mer" }))
    await expect(
      canvas.getByText("Her ligger den utdypende informasjonen."),
    ).toBeVisible()
  },
}

export const Open: Story = {
  args: { open: true, summary: "Åpen informasjon" },
}

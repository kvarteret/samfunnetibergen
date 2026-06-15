import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import { ErrorSummary } from "./error-summary"
import { Input } from "./input"

const meta = {
  component: ErrorSummary,
  tags: ["ai-generated"],
  args: {
    errors: [
      { fieldId: "summary-name", message: "Skriv inn navn." },
      { fieldId: "summary-email", message: "Skriv inn en gyldig e-post." },
    ],
  },
} satisfies Meta<typeof ErrorSummary>

export default meta
type Story = StoryObj<typeof meta>

export const MultipleErrors: Story = {
  render: args => (
    <div className="space-y-6">
      <ErrorSummary {...args} />
      <Input id="summary-name" aria-label="Navn" />
      <Input id="summary-email" aria-label="E-post" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveFocus()
    await expect(
      canvas.getByRole("link", { name: "Skriv inn navn." }),
    ).toHaveAttribute("href", "#summary-name")
  },
}

export const CustomTitle: Story = {
  args: { title: "Kontroller skjemaet" },
}

export const NoErrors: Story = {
  args: { errors: [] },
}

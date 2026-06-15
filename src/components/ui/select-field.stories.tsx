import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { SelectField } from "./select-field"

const options = [
  { value: "concert", label: "Konsert" },
  { value: "meeting", label: "Møte" },
  { value: "closed", label: "Stengt valg", disabled: true },
]

const meta = {
  component: SelectField,
  tags: ["ai-generated"],
  args: {
    id: "event-type",
    label: "Arrangementstype",
    onChange: fn(),
    options,
    value: "concert",
  },
} satisfies Meta<typeof SelectField>

export default meta
type Story = StoryObj<typeof meta>

export const Selected: Story = {}

export const WithHint: Story = {
  args: { hint: "Velg kategorien som passer best." },
}

export const Placeholder: Story = {
  args: { id: "event-type-placeholder", placeholder: "Velg type", value: "" },
}

export const Invalid: Story = {
  args: {
    error: "Velg en arrangementstype.",
    errorId: "event-type-error",
    id: "event-type-invalid",
    value: "",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox")).toHaveAttribute(
      "aria-invalid",
      "true",
    )
  },
}

export const Disabled: Story = {
  args: { disabled: true, id: "event-type-disabled" },
}

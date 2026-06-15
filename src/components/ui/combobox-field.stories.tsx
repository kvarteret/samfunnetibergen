import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { ComboboxField } from "./combobox-field"

const options = [
  { value: "hulen", label: "Hulen" },
  { value: "kvarteret", label: "Det Akademiske Kvarter" },
  { value: "studentteateret", label: "Studentteateret Immaturus" },
]

const meta = {
  component: ComboboxField,
  tags: ["ai-generated"],
  args: {
    id: "organizer",
    label: "Arrangør",
    onChange: fn(),
    options,
    placeholder: "Søk etter arrangør",
    value: "",
  },
} satisfies Meta<typeof ComboboxField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Selected: Story = {
  args: { id: "selected-organizer", value: "kvarteret" },
}

export const Search: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("combobox")
    await userEvent.type(input, "Hulen")
    await expect(input).toHaveValue("Hulen")
  },
}

export const Invalid: Story = {
  args: {
    error: "Velg en arrangør.",
    errorId: "organizer-error",
    id: "invalid-organizer",
  },
}

export const Disabled: Story = {
  args: { disabled: true, id: "disabled-organizer" },
}

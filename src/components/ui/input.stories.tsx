import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Input } from "./input"

const meta = {
  component: Input,
  tags: ["ai-generated"],
  args: { placeholder: "Skriv her" },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Text: Story = {}

export const Email: Story = {
  args: {
    autoComplete: "email",
    placeholder: "navn@example.no",
    type: "email",
  },
}

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "Feil verdi" },
}

export const Disabled: Story = {
  args: { disabled: true, value: "Kan ikke redigeres" },
}

export const File: Story = {
  args: { type: "file" },
}

import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Textarea } from "./textarea"

const meta = {
  component: Textarea,
  tags: ["ai-generated"],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: "Beskriv arrangementet" },
}

export const WithContent: Story = {
  args: { defaultValue: "Arrangementet starter med en kort introduksjon." },
}

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "For kort" },
}

export const Disabled: Story = {
  args: { disabled: true, value: "Kan ikke redigeres" },
}

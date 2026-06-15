import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { FieldGroup, FieldHint } from "./field-group"
import { Input } from "./input"
import { Label } from "./label"

const meta = {
  component: FieldGroup,
  tags: ["ai-generated"],
} satisfies Meta<typeof FieldGroup>

export default meta
type Story = StoryObj<typeof meta>

export const WithHint: Story = {
  args: {
    children: (
      <>
        <Label htmlFor="phone">Telefon</Label>
        <FieldHint>Åtte siffer uten landskode</FieldHint>
        <Input id="phone" inputMode="tel" placeholder="12345678" />
      </>
    ),
  },
}

export const WithError: Story = {
  args: {
    children: (
      <>
        <Label htmlFor="email-error">E-post</Label>
        <Input
          aria-describedby="email-error-message"
          aria-invalid
          id="email-error"
          value="ikke en e-post"
          readOnly
        />
      </>
    ),
    error: "Skriv inn en gyldig e-post.",
    errorId: "email-error-message",
  },
}

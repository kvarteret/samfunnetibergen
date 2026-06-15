import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { FieldError } from "./field-error"
import { FieldGroup } from "./field-group"
import { Input } from "./input"
import { Label } from "./label"

const meta = {
  component: FieldError,
  tags: ["ai-generated"],
} satisfies Meta<typeof FieldError>

export default meta
type Story = StoryObj<typeof meta>

export const InvalidField: Story = {
  args: {
    children: "Dette feltet er påkrevd.",
    id: "standalone-field-error",
  },
  render: args => (
    <FieldGroup error="invalid">
      <Label htmlFor="required-name">Navn</Label>
      <Input aria-describedby={args.id} aria-invalid id="required-name" />
      <FieldError {...args} />
    </FieldGroup>
  ),
}

import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { FieldGroup } from "./field-group"
import { Input } from "./input"
import { Label } from "./label"

const meta = {
  component: Label,
  tags: ["ai-generated"],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: "E-postadresse", htmlFor: "label-email" },
  render: args => (
    <FieldGroup className="max-w-sm">
      <Label {...args} />
      <Input id="label-email" type="email" />
    </FieldGroup>
  ),
}

export const Required: Story = {
  args: { children: "Navn *", htmlFor: "label-name" },
  render: args => (
    <FieldGroup className="max-w-sm">
      <Label {...args} />
      <Input id="label-name" required />
    </FieldGroup>
  ),
}

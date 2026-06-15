import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { FieldGroup } from "./field-group"
import { FormSection } from "./form-section"
import { Input } from "./input"
import { Label } from "./label"

const meta = {
  component: FormSection,
  tags: ["ai-generated"],
} satisfies Meta<typeof FormSection>

export default meta
type Story = StoryObj<typeof meta>

export const Numbered: Story = {
  args: {
    children: (
      <FieldGroup>
        <Label htmlFor="event-name">Navn på arrangement</Label>
        <Input id="event-name" placeholder="For eksempel studentkonsert" />
      </FieldGroup>
    ),
    number: "01",
    title: "Om arrangementet",
  },
}

export const WithoutNumber: Story = {
  args: {
    children: <p className="text-foreground-muted">Seksjonsinnhold</p>,
    title: "Kontaktinformasjon",
  },
}

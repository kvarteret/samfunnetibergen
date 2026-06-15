import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { CheckboxField } from "./checkbox-field"

const meta = {
  component: CheckboxField,
  tags: ["ai-generated"],
  args: {
    checked: false,
    id: "equipment",
    label: "Jeg trenger lydanlegg",
    onChange: fn(),
  },
} satisfies Meta<typeof CheckboxField>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox"))
    await expect(args.onChange).toHaveBeenCalledWith(true, expect.anything())
  },
}

export const Checked: Story = {
  args: { checked: true, id: "equipment-checked" },
}

export const WithHint: Story = {
  args: {
    hint: "Tekniker bestilles separat.",
    id: "equipment-hint",
  },
}

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    error: "Du må godta vilkårene.",
    errorId: "terms-error",
    id: "terms",
    label: "Jeg godtar vilkårene",
  },
}

export const Disabled: Story = {
  args: { disabled: true, id: "equipment-disabled" },
}

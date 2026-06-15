import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { RadioGroup, RadioGroupItem } from "./radio-group"

const meta = {
  component: RadioGroup,
  tags: ["ai-generated"],
  args: {
    "aria-label": "Papirstil",
    onValueChange: fn(),
    value: "grid",
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Solid: Story = {
  render: args => (
    <RadioGroup {...args}>
      <RadioGroupItem value="grid">Rutenett</RadioGroupItem>
      <RadioGroupItem value="dots">Prikker</RadioGroupItem>
      <RadioGroupItem disabled value="ruled">
        Linjer
      </RadioGroupItem>
    </RadioGroup>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("radio", { name: "Prikker" }))
    await expect(args.onValueChange).toHaveBeenCalledWith(
      "dots",
      expect.anything(),
    )
  },
}

export const Soft: Story = {
  render: args => (
    <RadioGroup {...args}>
      <RadioGroupItem appearance="soft" value="grid">
        Rutenett
      </RadioGroupItem>
      <RadioGroupItem appearance="soft" value="dots">
        Prikker
      </RadioGroupItem>
    </RadioGroup>
  ),
}

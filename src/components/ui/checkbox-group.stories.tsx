import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { CheckboxGroup, CheckboxGroupItem } from "./checkbox-group"

const meta = {
  component: CheckboxGroup,
  tags: ["ai-generated"],
  args: {
    "aria-label": "Utstyrsbehov",
    onValueChange: fn(),
    value: ["stage"],
  },
} satisfies Meta<typeof CheckboxGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Equipment: Story = {
  render: args => (
    <CheckboxGroup {...args}>
      <CheckboxGroupItem label="Scene" value="stage" />
      <CheckboxGroupItem label="Lydanlegg" value="sound" />
      <CheckboxGroupItem
        disabled
        label="Lysrigg (utilgjengelig)"
        value="lights"
      />
    </CheckboxGroup>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: "Lydanlegg" }))
    await expect(args.onValueChange).toHaveBeenCalled()
  },
}

import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { SelectableCard, SelectableCardGroup } from "./selectable-card"

const meta = {
  component: SelectableCard,
  tags: ["ai-generated"],
} satisfies Meta<typeof SelectableCard>

export default meta
type Story = StoryObj<typeof meta>

export const Rooms: Story = {
  args: {
    children: null,
    value: "storsalen",
  },
  render: () => (
    <SelectableCardGroup
      aria-label="Velg rom"
      className="max-w-3xl sm:grid-cols-3"
      defaultValue="storsalen"
      onValueChange={fn()}
    >
      <SelectableCard value="storsalen">
        <p className="font-heading">Storsalen</p>
        <p className="text-foreground-muted">350 stående</p>
      </SelectableCard>
      <SelectableCard value="tivoli">
        <p className="font-heading">Tivoli</p>
        <p className="text-foreground-muted">120 stående</p>
      </SelectableCard>
      <SelectableCard disabled value="eldorado">
        <p className="font-heading">Eldorado</p>
        <p className="text-foreground-muted">Ikke tilgjengelig</p>
      </SelectableCard>
    </SelectableCardGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const tivoli = canvas.getByRole("radio", { name: /Tivoli/ })
    await userEvent.click(tivoli)
    await expect(tivoli).toBeChecked()
  },
}

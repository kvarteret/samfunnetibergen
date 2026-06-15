import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { X } from "lucide-react"
import { expect, within } from "storybook/test"

import { Button } from "./button"
import { Tooltip } from "./tooltip"

const meta = {
  component: Tooltip,
  tags: ["ai-generated"],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const IconButton: Story = {
  args: {
    children: (
      <Button aria-label="Fjern dato" size="icon" variant="neutral">
        <X aria-hidden />
      </Button>
    ),
    content: "Fjern dato",
  },
  play: async ({ canvas, userEvent, canvasElement }) => {
    await userEvent.hover(canvas.getByRole("button", { name: "Fjern dato" }))
    const body = within(canvasElement.ownerDocument.body)
    await expect(await body.findByRole("tooltip")).toHaveTextContent(
      "Fjern dato",
    )
  },
}

export const TextTrigger: Story = {
  args: {
    children: <button type="button">Hva betyr dette?</button>,
    content: "Mer informasjon om feltet.",
  },
}

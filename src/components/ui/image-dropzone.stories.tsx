import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import { ImageDropzone } from "./image-dropzone"

const meta = {
  component: ImageDropzone,
  tags: ["ai-generated"],
  args: {
    onImageChange: fn(),
  },
} satisfies Meta<typeof ImageDropzone>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomLabel: Story = {
  args: { label: "Last opp arrangementsbilde" },
}

export const ImageSelected: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const file = new File(["image"], "event.png", { type: "image/png" })
    await userEvent.upload(
      canvas.getByLabelText("Klikk for å velge bilde"),
      file,
    )
    await expect(args.onImageChange).toHaveBeenCalled()
  },
}

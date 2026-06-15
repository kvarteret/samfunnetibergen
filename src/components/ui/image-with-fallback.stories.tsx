import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ImageIcon } from "lucide-react"

import { ImageWithFallback } from "./image-with-fallback"

const fallback = (
  <div className="flex flex-col items-center gap-2 text-foreground-muted">
    <ImageIcon aria-hidden className="size-8" />
    <span>Ingen bilde</span>
  </div>
)

const meta = {
  component: ImageWithFallback,
  tags: ["ai-generated"],
  args: {
    alt: "Lokale på Kvarteret",
    className: "max-w-xl",
    fallback,
  },
} satisfies Meta<typeof ImageWithFallback>

export default meta
type Story = StoryObj<typeof meta>

export const MissingImage: Story = {}

export const SquareFallback: Story = {
  args: { aspectRatio: "1/1", className: "max-w-64" },
}

export const WideFallback: Story = {
  args: { aspectRatio: "21/9" },
}

import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CalendarClock } from "lucide-react"

import { DetailRow } from "./detail-row"

const meta = {
  component: DetailRow,
  tags: ["ai-generated"],
} satisfies Meta<typeof DetailRow>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  args: { children: "Grøndahls", label: "Sted" },
}

export const VerticalWithIcon: Story = {
  args: {
    children: "14. juni 2026 kl. 19:00",
    icon: CalendarClock,
    label: "Tidspunkt",
    layout: "vertical",
  },
}

export const LabelColumn: Story = {
  args: {
    children: "350 personer",
    label: "Kapasitet",
    layout: "labelColumn",
  },
}

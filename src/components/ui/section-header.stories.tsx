import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { SectionHeader } from "./section-header"

const meta = {
  component: SectionHeader,
  tags: ["ai-generated"],
} satisfies Meta<typeof SectionHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Numbered: Story = {
  args: { number: "03", title: "Dato og tid" },
}

export const WithoutNumber: Story = {
  args: { title: "Vilkår" },
}

import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "./accordion"

const meta = {
  component: Accordion,
  tags: ["ai-generated"],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const FrequentlyAskedQuestions: Story = {
  render: args => (
    <Accordion {...args}>
      <AccordionItem value="membership">
        <AccordionTrigger>Hvem kan bli medlem?</AccordionTrigger>
        <AccordionPanel>
          Alle studenter i Bergen kan søke om medlemskap.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="meetings">
        <AccordionTrigger>Når møtes gruppene?</AccordionTrigger>
        <AccordionPanel>Møtetidene varierer mellom gruppene.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", {
      name: "Hvem kan bli medlem?",
    })
    await userEvent.click(trigger)
    await expect(
      canvas.getByText("Alle studenter i Bergen kan søke om medlemskap."),
    ).toBeVisible()
  },
}

export const InitiallyOpen: Story = {
  args: { defaultValue: ["membership"] },
  render: args => (
    <Accordion {...args}>
      <AccordionItem value="membership">
        <AccordionTrigger>Medlemskap</AccordionTrigger>
        <AccordionPanel>Informasjon om medlemskap.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
}

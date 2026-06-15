import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import { Alert, AlertDescription, AlertTitle } from "./alert"

const meta = {
  component: Alert,
  tags: ["ai-generated"],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  render: args => (
    <Alert {...args}>
      <AlertTitle>Booking mottatt</AlertTitle>
      <AlertDescription>
        Vi sender en bekreftelse når forespørselen er behandlet.
      </AlertDescription>
    </Alert>
  ),
}

export const Success: Story = {
  args: {
    variant: "success",
  },
  render: args => (
    <Alert {...args}>
      <AlertTitle>Arrangementet er sendt inn</AlertTitle>
      <AlertDescription>Redaksjonen vurderer innsendingen.</AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  args: {
    variant: "destructive",
  },
  render: args => (
    <Alert {...args}>
      <AlertTitle>Kunne ikke lagre</AlertTitle>
      <AlertDescription>Kontroller feltene og prøv igjen.</AlertDescription>
    </Alert>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Kunne ikke lagre",
    )
  },
}

import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "./button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

const meta = {
  component: Card,
  tags: ["ai-generated"],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => (
    <Card {...args} className="max-w-md">
      <CardHeader>
        <CardTitle>Storelogen</CardTitle>
        <CardDescription>
          Et fleksibelt lokale for mindre møter.
        </CardDescription>
      </CardHeader>
      <CardContent>Opptil 20 sittende gjester.</CardContent>
    </Card>
  ),
}

export const WithAction: Story = {
  render: args => (
    <Card {...args} className="max-w-md">
      <CardHeader>
        <CardTitle>Tivoli</CardTitle>
        <CardDescription>Scene og dansegulv i første etasje.</CardDescription>
        <CardAction>
          <Button size="sm">Se rommet</Button>
        </CardAction>
      </CardHeader>
      <CardContent>Passer for konserter og større arrangementer.</CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: args => (
    <Card {...args} className="max-w-md">
      <CardHeader>
        <CardTitle>Book rom</CardTitle>
      </CardHeader>
      <CardContent>Velg et rom som passer arrangementet ditt.</CardContent>
      <CardFooter className="border-t">
        <Button>Start booking</Button>
      </CardFooter>
    </Card>
  ),
}

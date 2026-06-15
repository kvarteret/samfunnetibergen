import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel"

const slides = ["Storsalen", "Tivoli", "Storelogen"]

const meta = {
  component: Carousel,
  tags: ["ai-generated"],
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  args: { className: "mx-12 max-w-xl" },
  render: args => (
    <Carousel {...args}>
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={slide}>
            <div
              className="flex min-h-48 items-center justify-center border-2 border-border bg-card font-heading text-2xl"
              data-slide={index + 1}
            >
              {slide}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
  play: async ({ canvas, userEvent }) => {
    const next = canvas.getByRole("button", { name: "Next slide" })
    await expect(next).toBeEnabled()
    await userEvent.click(next)
    await expect(
      canvas.getByRole("button", { name: "Previous slide" }),
    ).toBeEnabled()
  },
}

export const Vertical: Story = {
  args: { className: "my-12 max-w-sm", orientation: "vertical" },
  render: args => (
    <Carousel {...args}>
      <CarouselContent className="h-52">
        {slides.map(slide => (
          <CarouselItem key={slide}>
            <div className="flex h-52 items-center justify-center border-2 border-border bg-card font-heading">
              {slide}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
}

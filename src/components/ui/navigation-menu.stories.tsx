import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu"

const meta = {
  component: NavigationMenu,
  tags: ["ai-generated"],
} satisfies Meta<typeof NavigationMenu>

export default meta
type Story = StoryObj<typeof meta>

export const MainNavigation: Story = {
  render: args => (
    <NavigationMenu {...args} delay={0}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="/nb/arrangementer" variant="top">
            Arrangementer
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem value="visit">
          <NavigationMenuTrigger>Besøk oss</NavigationMenuTrigger>
          <NavigationMenuContent className="w-64 p-3">
            <NavigationMenuLink href="/nb/kontakt">Kontakt</NavigationMenuLink>
            <NavigationMenuLink href="/nb/rom">Rom</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
  play: async ({ canvas, userEvent, canvasElement }) => {
    const trigger = canvas.getByRole("button", { name: "Besøk oss" })
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute("data-popup-open")
    await expect(
      canvasElement.ownerDocument.body.querySelector('a[href="/nb/kontakt"]'),
    ).not.toBeNull()
  },
}

export const TopLevelLinks: Story = {
  render: args => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="/nb" variant="top">
            Hjem
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/nb/grupper" variant="top">
            Grupper
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
}

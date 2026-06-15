import type { Preview } from "@storybook/nextjs-vite"
import { initialize, mswLoader } from "msw-storybook-addon"

import { Providers } from "../src/app/providers"
import "../src/app/globals.css"
import { mswHandlers } from "./msw-handlers"

initialize({ onUnhandledRequest: "bypass" })

const preview: Preview = {
  decorators: [
    Story => (
      <Providers>
        <div className="min-h-screen bg-background p-6 text-foreground">
          <Story />
        </div>
      </Providers>
    ),
  ],
  loaders: [mswLoader],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
    msw: {
      handlers: mswHandlers,
    },
  },
}

export default preview

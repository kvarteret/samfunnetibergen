import path from "node:path"
import { fileURLToPath } from "node:url"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        optimizeDeps: {
          include: [
            "@base-ui/react/accordion",
            "@base-ui/react/avatar",
            "@base-ui/react/button",
            "@base-ui/react/checkbox",
            "@base-ui/react/checkbox-group",
            "@base-ui/react/collapsible",
            "@base-ui/react/combobox",
            "@base-ui/react/field",
            "@base-ui/react/input",
            "@base-ui/react/navigation-menu",
            "@base-ui/react/number-field",
            "@base-ui/react/radio",
            "@base-ui/react/radio-group",
            "@base-ui/react/select",
            "@base-ui/react/toggle",
            "@base-ui/react/toggle-group",
            "@base-ui/react/tooltip",
            "embla-carousel-react",
            "lucide-react",
          ],
        },
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
})

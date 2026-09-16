import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Sanity TypeGen writes a back-compat shim for `@sanity/client` releases
    // that predate the global query registry:
    // `declare module "@sanity/client" { interface SanityQueries extends globalThis.SanityQueries {} }`.
    // The file is generated, so the empty-interface shape is not ours to change.
    files: ["src/lib/sanity/sanity.types.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "storybook-static/**",
    "src/lib/integrations/kvarteret-personal-api/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig

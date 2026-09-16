import js from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import tseslint from "typescript-eslint"

// The studio is a Sanity Studio (React + TypeScript), so it uses the base JS and
// TypeScript recommendations plus the React Hooks rules. It does not use the
// Next.js config that apps/web uses.
export default tseslint.config(
  { ignores: ["dist/**", ".sanity/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
)

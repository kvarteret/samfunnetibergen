import { svelte } from "@sveltejs/vite-plugin-svelte"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

// The prototype runs on fake data only. When the real client is added, the
// dev server proxies /personal/* to a local Personal (see README.md), so the
// browser talks to one origin in development as it will on Vercel.
const personal = {
  target: process.env.PERSONAL_URL ?? "http://localhost:8000",
  changeOrigin: true,
}

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  server: {
    proxy: {
      // /personal/x in the browser becomes http://localhost:8000/x (the
      // prefix is stripped). The cookie travels as it does on Personal itself.
      "/personal": {
        target: process.env.PERSONAL_URL ?? "http://localhost:8000",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/personal/, ""),
      },
      // Personal's own login page and its files (the login form posts to
      // /login, so these must be on the app's host too, as on Vercel).
      "/login": personal,
      "/logout": personal,
      "/static": personal,
    },
  },
})

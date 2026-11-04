import "@fontsource-variable/dm-sans"
import "@fontsource-variable/fraunces"
import "./styles.css"
import { mount } from "svelte"
import App from "./App.svelte"
import { createFakeApi, mondayOf } from "./core/fake"
import { createHttpApi } from "./core/http"

const target = document.getElementById("root")
if (!target) throw new Error("Missing #root")

// Which data the page uses: "fake" (the prototype, invented data in memory)
// or "http" (Personal, through /personal/*). Builds choose with
// VITE_LEADER_API; in development `?api=http` switches one page load.
const requested = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get("api")
  : null
const mode = requested ?? import.meta.env.VITE_LEADER_API ?? "fake"

if (mode === "http") {
  // Today in Oslo, as yyyy-mm-dd.
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
  }).format(new Date())
  mount(App, {
    target,
    props: {
      api: createHttpApi(),
      initialWeek: mondayOf(today),
      limitWeeks: false,
      live: true,
    },
  })
} else {
  mount(App, { target, props: { api: createFakeApi() } })
}

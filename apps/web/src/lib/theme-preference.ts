export const THEME_STORAGE_KEY = "samfunnet-theme"

export const themeOptions = [
  { value: "hs", label: "HS" },
  { value: "skyss", label: "Skyss" },
] as const

export type ThemeName = (typeof themeOptions)[number]["value"]

export const DEFAULT_THEME: ThemeName = "hs"

export function isTheme(value: string | undefined | null): value is ThemeName {
  return themeOptions.some(option => option.value === value)
}

/**
 * Single resolution point for the active theme. Sources are checked in
 * priority order: an explicit user override always wins, then a future
 * experiment assignment, then the default.
 *
 * This is the seam for PostHog experiments. When we run one, pass the flag
 * variant as `experiment` here — nothing downstream changes, because every
 * consumer only ever reads the `data-theme` attribute this resolves into.
 */
export function resolveTheme(sources: {
  override?: string | null
  experiment?: string | null
}): ThemeName {
  if (isTheme(sources.override)) return sources.override
  if (isTheme(sources.experiment)) return sources.experiment
  return DEFAULT_THEME
}

// Runs before paint (beforeInteractive). Only rewrites `data-theme` when the
// user has an explicit override stored; otherwise the server-rendered default
// stands, so the common case never flashes.
export const themePreferenceScript = `
try {
  var t = localStorage.getItem("${THEME_STORAGE_KEY}");
  if (t === "hs" || t === "skyss") {
    document.documentElement.dataset.theme = t;
  }
} catch {}
`

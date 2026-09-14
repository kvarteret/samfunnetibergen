import { stegaClean } from "@sanity/client/stega"
import { VERGEORDNING_SECTION_KEY } from "./queries/pages"

export interface UsefulInfoNavigationSection {
  _key: string | null
}

/**
 * Build the Nyttig info shortcut from the section metadata that also drives
 * the page's rendered anchor ids. A missing or incomplete section is a safe
 * reason to omit the shortcut rather than invent a fragment.
 */
export function getVergeordningHref(
  section: UsefulInfoNavigationSection | null | undefined,
): string | null {
  const key = section?._key ? stegaClean(section._key) : null

  return key === VERGEORDNING_SECTION_KEY ? `/nyttig#${key}` : null
}

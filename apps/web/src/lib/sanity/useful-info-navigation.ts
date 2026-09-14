import { stegaClean } from "@sanity/client/stega"

export interface UsefulInfoNavigationSection {
  _key: string | null
  isVergeordning?: boolean | null
  label?: string | null
}

/**
 * Build the Nyttig info shortcut from the section metadata that also drives
 * the page's rendered anchor ids. A missing or incomplete section is a safe
 * reason to omit the shortcut rather than invent a fragment.
 */
export function getVergeordningHref(
  sections: readonly (UsefulInfoNavigationSection | null)[] | null | undefined,
): string | null {
  const section = sections?.find(
    candidate => candidate?.isVergeordning && candidate._key,
  )
  const key = section?._key ? stegaClean(section._key) : null

  return key ? `/nyttig#${key}` : null
}

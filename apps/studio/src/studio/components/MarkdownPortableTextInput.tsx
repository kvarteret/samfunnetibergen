import { useCallback } from "react"
import type { ArrayOfObjectsInputProps } from "sanity"

import { looksLikeMarkdown, markdownToContentBlocks } from "./markdownPaste"

/** Formats pasted plain-text markdown (e.g. from ChatGPT or a README). */
export function MarkdownPortableTextInput(props: ArrayOfObjectsInputProps) {
  const onPaste = useCallback(
    ({ event }: { event: { clipboardData: DataTransfer | null } }) => {
      const data = event.clipboardData
      if (!data || data.getData("text/html")) return undefined
      const text = data.getData("text/plain")
      if (!text || !looksLikeMarkdown(text)) return undefined
      return { insert: markdownToContentBlocks(text) }
    },
    [],
  )
  return props.renderDefault({ ...props, onPaste } as typeof props)
}

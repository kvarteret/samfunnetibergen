import { useCallback } from "react"
import type { ArrayOfObjectsInputProps } from "sanity"
import styled from "styled-components"

import { looksLikeMarkdown, markdownToContentBlocks } from "./markdownPaste"

// Room for a few paragraphs before the editor has to be expanded.
const Roomy = styled.div`
  [data-testid="pt-editor"] [contenteditable="true"] {
    min-height: 10rem;
  }
`

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
  return (
    <Roomy>{props.renderDefault({ ...props, onPaste } as typeof props)}</Roomy>
  )
}

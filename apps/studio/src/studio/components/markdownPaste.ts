import { markdownToPortableText } from "@portabletext/markdown"

// Our editor offers h2–h4; a pasted "# Title" becomes the top available level.
const STYLE_MAP: Record<string, string> = {
  h1: "h2",
  h2: "h3",
  h3: "h4",
  h4: "h4",
  h5: "h4",
  h6: "h4",
}

const MARKDOWN_SIGNS = [
  /^#{1,6}\s/m,
  /^\s*[-*+]\s+\S/m,
  /^\s*\d+[.)]\s+\S/m,
  /^>\s/m,
  /\*\*[^*\n]+\*\*/,
  /__[^_\n]+__/,
  /\[[^\]\n]+\]\([^)\s]+\)/,
  /`[^`\n]+`/,
]

/** True when plain text carries enough markdown syntax to convert. */
export function looksLikeMarkdown(text: string): boolean {
  return MARKDOWN_SIGNS.some(sign => sign.test(text))
}

type Block = {
  _type: string
  style?: string
  children?: Array<{
    _type: string
    _key?: string
    text?: string
    marks?: string[]
  }>
  [key: string]: unknown
}

/**
 * Converts markdown to text blocks that fit `portableTextContent`. Constructs
 * the schema lacks (code blocks, tables, rules, images) become plain text so
 * nothing pasted is lost.
 */
export function markdownToContentBlocks(markdown: string): Block[] {
  const blocks = markdownToPortableText(markdown) as Block[]
  return blocks.flatMap((block): Block[] => {
    if (block._type === "block") {
      const style = block.style ?? "normal"
      return [{ ...block, style: STYLE_MAP[style] ?? style }]
    }
    const text =
      typeof block.code === "string"
        ? block.code
        : typeof block.alt === "string" && block.alt
          ? block.alt
          : ""
    if (!text) return []
    return [
      {
        _type: "block",
        _key: `${String(block._key ?? "md")}-text`,
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: `${String(block._key ?? "md")}-span`,
            text,
            marks: [],
          },
        ],
      },
    ]
  })
}

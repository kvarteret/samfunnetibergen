import { toPlainText } from "@portabletext/toolkit"
import { escapeHTML, toHTML } from "@portabletext/to-html"

type PortableTextValue = readonly Record<string, unknown>[]

type PortableTextImage = {
  imageUrl?: unknown
  alt?: unknown
  caption?: unknown
}

type PortableTextLink = {
  href?: unknown
  target?: unknown
}

export type PublicDescription = {
  html: string
  text: string
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function safeLink(value: unknown): string | null {
  const href = stringValue(value)
  if (!href) return null
  if (href.startsWith("/") && !href.startsWith("//")) return href
  if (href.startsWith("#")) return href

  try {
    const url = new URL(href)
    if (["mailto:", "tel:"].includes(url.protocol)) return href
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname &&
      !url.username &&
      !url.password
    ) {
      return href
    }
  } catch {
    return null
  }

  return null
}

function safeImage(value: unknown): string | null {
  const url = stringValue(value)
  if (!url) return null

  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.hostname && !parsed.username && !parsed.password
        ? url
        : null
      : null
  } catch {
    return null
  }
}

function imageComponent({ value }: { value: PortableTextImage }): string {
  const imageUrl = safeImage(value.imageUrl)
  if (!imageUrl) return ""

  const alt = stringValue(value.alt) ?? ""
  const caption = stringValue(value.caption)
  return `<figure><img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(alt)}" />${caption ? `<figcaption>${escapeHTML(caption)}</figcaption>` : ""}</figure>`
}

function linkComponent({
  children,
  value,
}: {
  children?: string
  value?: PortableTextLink
}): string {
  const href = safeLink(value?.href)
  const content = children ?? ""
  if (!href) return content

  const target = value?.target === "blank" ? ' target="_blank"' : ""
  const rel = target ? ' rel="noreferrer noopener"' : ""
  return `<a href="${escapeHTML(href)}"${target}${rel}>${content}</a>`
}

type HtmlChildren = { children?: string }

function childrenValue({ children }: HtmlChildren): string {
  return children ?? ""
}

const publicPortableTextComponents = {
  types: {
    image: imageComponent,
  },
  marks: {
    link: linkComponent,
    strong: (props: HtmlChildren) => `<strong>${childrenValue(props)}</strong>`,
    em: (props: HtmlChildren) => `<em>${childrenValue(props)}</em>`,
    code: (props: HtmlChildren) => `<code>${childrenValue(props)}</code>`,
  },
  block: {
    normal: (props: HtmlChildren) => `<p>${childrenValue(props)}</p>`,
    h2: (props: HtmlChildren) => `<h2>${childrenValue(props)}</h2>`,
    h3: (props: HtmlChildren) => `<h3>${childrenValue(props)}</h3>`,
    h4: (props: HtmlChildren) => `<h4>${childrenValue(props)}</h4>`,
    blockquote: (props: HtmlChildren) =>
      `<blockquote>${childrenValue(props)}</blockquote>`,
  },
  list: {
    bullet: (props: HtmlChildren) => `<ul>${childrenValue(props)}</ul>`,
    number: (props: HtmlChildren) => `<ol>${childrenValue(props)}</ol>`,
  },
  listItem: {
    bullet: (props: HtmlChildren) => `<li>${childrenValue(props)}</li>`,
    number: (props: HtmlChildren) => `<li>${childrenValue(props)}</li>`,
  },
  unknownType: () => "",
  unknownMark: (props: HtmlChildren) => childrenValue(props),
  unknownBlockStyle: (props: HtmlChildren) => `<p>${childrenValue(props)}</p>`,
  unknownList: (props: HtmlChildren) => `<ul>${childrenValue(props)}</ul>`,
  unknownListItem: (props: HtmlChildren) => `<li>${childrenValue(props)}</li>`,
}

/** Convert editor Portable Text into the small, safe contract used by v1. */
export function serializePublicDescription(
  value: readonly Record<string, unknown>[] | null | undefined,
): PublicDescription {
  const blocks: PortableTextValue = Array.isArray(value) ? value : []
  const html = toHTML(blocks as never, {
    components: publicPortableTextComponents,
    onMissingComponent: false,
  })

  let text = ""
  try {
    text = toPlainText(blocks as never).trim()
  } catch {
    text = ""
  }

  return { html, text }
}

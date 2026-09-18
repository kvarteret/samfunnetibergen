import { PortableText } from "next-sanity"

import { SanityImage } from "@/components/ui/sanity-image"
import { cn } from "@/lib/utils"

type PortableTextBlock = {
  _key?: string
  _type: string
  [key: string]: unknown
}

type PortableTextContentProps = {
  className?: string
  value: PortableTextBlock[] | null | undefined
}

type PortableTextChildrenProps = {
  children?: React.ReactNode
}

type PortableTextImageValue = {
  id?: string
  alt?: string
  caption?: string
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  } | null
  hotspot?: { x: number; y: number } | null
  lqip?: string | null
}

type PortableTextLinkValue = {
  href?: string
  style?: "inline" | "cta"
  target?: "self" | "blank"
  blank?: boolean
}

export function PortableTextContent({
  className,
  value,
}: PortableTextContentProps) {
  if (!value?.length) {
    return null
  }

  let textBlocks: PortableTextBlock[] = []

  return value.map((block, index, blocks) => {
    if (block._type === "block") {
      textBlocks = [...textBlocks, block]

      if (blocks[index + 1]?._type === "block") {
        return null
      }

      const groupedTextBlocks = textBlocks
      textBlocks = []

      return (
        <div
          className={[
            "paper-prose prose prose-neutral max-w-none dark:prose-invert",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          key={block._key}
        >
          <PortableText
            components={portableTextComponents}
            value={groupedTextBlocks}
          />
        </div>
      )
    }

    return (
      <PortableText
        components={portableTextComponents}
        key={block._key}
        value={block}
      />
    )
  })
}

const portableTextComponents = {
  types: {
    image: PortableTextImage,
  },
  marks: {
    link: PortableTextLink,
  },
}

function PortableTextImage({ value }: { value: PortableTextImageValue }) {
  if (!value.id) {
    return null
  }

  return (
    <figure className="my-10">
      <SanityImage
        alt={value.alt ?? ""}
        className="h-auto w-full border-2 border-border"
        crop={value.crop ?? undefined}
        hotspot={value.hotspot ?? undefined}
        id={value.id}
        mode="contain"
        preview={value.lqip ?? undefined}
        sizes="(max-width: 1280px) 100vw, 1280px"
        width={1280}
      />
      {value.caption && (
        <figcaption className="mt-2 text-foreground-muted">
          {value.caption}
        </figcaption>
      )}
    </figure>
  )
}

function PortableTextLink({
  children,
  value,
}: PortableTextChildrenProps & {
  value?: PortableTextLinkValue
}) {
  if (!value?.href) {
    return children
  }

  const opensInNewTab = value.target === "blank" || value.blank === true
  const isCta = value.style === "cta"

  return (
    <a
      className={cn(
        isCta &&
          "not-prose group inline-flex items-center gap-2 font-heading underline underline-offset-4",
      )}
      href={value.href}
      rel={opensInNewTab ? "noreferrer" : undefined}
      target={opensInNewTab ? "_blank" : undefined}
    >
      {children}
      {isCta ? <span aria-hidden>→</span> : null}
    </a>
  )
}

import type { ImageFrame } from "@samfunnet/content-domain/image-frame"
import { PortableText } from "next-sanity"

import { SanityImage } from "@/components/sanity-image"
import { cn } from "@/lib/utils"

type PortableTextBlock = {
  _key?: string
  _type: string
  [key: string]: unknown
}

type PortableTextContentProps = {
  className?: string
  nofollowLinks?: boolean
  value: PortableTextBlock[] | null | undefined
}

type PortableTextChildrenProps = {
  children?: React.ReactNode
}

type PortableTextImageValue = {
  imageUrl?: string
  alt?: string
  caption?: string
} & ImageFrame

type PortableTextLinkValue = {
  href?: string
  style?: "inline" | "cta"
  target?: "self" | "blank"
  blank?: boolean
}

export function PortableTextContent({
  className,
  nofollowLinks = false,
  value,
}: PortableTextContentProps) {
  if (!value?.length) {
    return null
  }

  const components = nofollowLinks
    ? {
        ...portableTextComponents,
        marks: {
          link: (
            props: PortableTextChildrenProps & {
              value?: PortableTextLinkValue
            },
          ) => <PortableTextLink {...props} nofollow />,
        },
      }
    : portableTextComponents

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
          <PortableText components={components} value={groupedTextBlocks} />
        </div>
      )
    }

    return (
      <PortableText components={components} key={block._key} value={block} />
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
  if (!value.imageUrl) {
    return null
  }

  return (
    <figure className="my-10">
      <div className="relative aspect-video overflow-hidden border-2 border-border">
        <SanityImage
          alt={value.alt ?? ""}
          aspectRatio={16 / 9}
          frame={value}
          sizes="(max-width: 1280px) 100vw, 1280px"
          src={value.imageUrl}
        />
      </div>
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
  nofollow = false,
}: PortableTextChildrenProps & {
  value?: PortableTextLinkValue
  nofollow?: boolean
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
      rel={
        [nofollow && "nofollow", opensInNewTab && "noopener noreferrer"]
          .filter(Boolean)
          .join(" ") || undefined
      }
      target={opensInNewTab ? "_blank" : undefined}
    >
      {children}
      {isCta ? <span aria-hidden>→</span> : null}
    </a>
  )
}

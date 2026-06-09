import Image from "next/image";
import { PortableText } from "next-sanity";

type PortableTextBlock = {
  _key?: string;
  _type: string;
  [key: string]: unknown;
};

type PortableTextContentProps = {
  value: PortableTextBlock[] | null | undefined;
};

type PortableTextChildrenProps = {
  children?: React.ReactNode;
};

type PortableTextImageValue = {
  imageUrl?: string;
  alt?: string;
  caption?: string;
};

type PortableTextLinkValue = {
  href?: string;
  target?: "self" | "blank";
  blank?: boolean;
};

export function PortableTextContent({ value }: PortableTextContentProps) {
  if (!value?.length) {
    return null;
  }

  let textBlocks: PortableTextBlock[] = [];

  return value.map((block, index, blocks) => {
    if (block._type === "block") {
      textBlocks = [...textBlocks, block];

      if (blocks[index + 1]?._type === "block") {
        return null;
      }

      const groupedTextBlocks = textBlocks;
      textBlocks = [];

      return (
        <div
          className="prose prose-neutral max-w-none dark:prose-invert"
          key={block._key}
        >
          <PortableText
            components={portableTextComponents}
            value={groupedTextBlocks}
          />
        </div>
      );
    }

    return (
      <PortableText
        components={portableTextComponents}
        key={block._key}
        value={block}
      />
    );
  });
}

const portableTextComponents = {
  types: {
    image: PortableTextImage,
  },
  marks: {
    link: PortableTextLink,
  },
};

function PortableTextImage({ value }: { value: PortableTextImageValue }) {
  if (!value.imageUrl) {
    return null;
  }

  return (
    <figure className="my-10">
      <div className="relative aspect-[16/9] overflow-hidden border-2 border-border">
        <Image
          alt={value.alt ?? ""}
          className="object-cover"
          fill
          sizes="(max-width: 1280px) 100vw, 1280px"
          src={value.imageUrl}
        />
      </div>
      {value.caption && (
        <figcaption className="mt-2 text-sm text-foreground/70">
          {value.caption}
        </figcaption>
      )}
    </figure>
  );
}

function PortableTextLink({
  children,
  value,
}: PortableTextChildrenProps & {
  value?: PortableTextLinkValue;
}) {
  if (!value?.href) {
    return children;
  }

  const opensInNewTab = value.target === "blank" || value.blank === true;

  return (
    <a
      href={value.href}
      rel={opensInNewTab ? "noreferrer" : undefined}
      target={opensInNewTab ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}

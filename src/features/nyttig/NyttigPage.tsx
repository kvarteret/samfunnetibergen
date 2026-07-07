import type { UsefulInfoPage } from "@/lib/sanity/fetch"
import { SectionBlock, sectionMeta } from "./SectionBlock"
import { SectionNav } from "./SectionNav"

export const NyttigPage = ({ page }: { page: UsefulInfoPage }) => {
  const sections = page.sections ?? []
  const navItems = sections.map(sectionMeta)

  return (
    <article className="flex w-full flex-col gap-12">
      <header className="space-y-5">
        {page.eyebrow ? (
          <p className="w-fit bg-primary px-3 py-1.5 font-heading text-primary-foreground">
            {page.eyebrow}
          </p>
        ) : null}
        <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
          {page.title}
        </h1>
        {page.intro ? (
          <p className="max-w-3xl text-xl leading-8 text-foreground-muted">
            {page.intro}
          </p>
        ) : null}
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start lg:gap-16">
        {navItems.length > 0 ? (
          <SectionNav
            className="mb-10 lg:order-2 lg:mb-0 lg:sticky lg:top-28"
            items={navItems}
          />
        ) : null}

        <div className="flex flex-col divide-y-2 divide-border lg:order-1">
          {sections.map(block => (
            <SectionBlock block={block} key={block._key} />
          ))}
        </div>
      </div>
    </article>
  )
}

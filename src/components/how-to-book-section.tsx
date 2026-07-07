import type { EditorialSection } from "@/lib/sanity/fetch"

interface HowToBookSectionProps {
  section: EditorialSection | null | undefined
}

export function HowToBookSection({ section }: HowToBookSectionProps) {
  if (!section?.title) return null

  return (
    <section aria-labelledby="how-to-heading" className="space-y-5">
      <h2 className="font-heading text-2xl text-foreground" id="how-to-heading">
        {section.title}
      </h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {section.paragraphs?.map((paragraph, i) => (
          <li
            className="flex gap-4 border-l-2 border-border pl-4"
            key={paragraph}
          >
            <span className="mt-0.5 shrink-0 font-heading text-foreground-muted">
              {i + 1}
            </span>
            <p className="leading-6 text-foreground">{paragraph}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

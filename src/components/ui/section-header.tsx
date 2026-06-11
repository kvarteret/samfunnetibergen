interface SectionHeaderProps {
  number: string
  title: string
}

export function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline gap-4 border-b-2 border-border pb-4">
      <span className="font-heading text-4xl leading-none text-primary">
        {number}
      </span>
      <h2 className="font-heading text-xl uppercase tracking-[0.15em] text-foreground">
        {title}
      </h2>
    </div>
  )
}

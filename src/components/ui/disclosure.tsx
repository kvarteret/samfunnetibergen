import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

interface DisclosureProps extends React.ComponentProps<"details"> {
  summary: React.ReactNode
}

export function Disclosure({
  summary,
  children,
  className,
  ...props
}: DisclosureProps) {
  return (
    <details
      className={cn(
        "group panel p-0 shadow-shadow",
        className,
      )}
      {...props}
    >
      <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-heading text-xl text-foreground focus-brutal [&::-webkit-details-marker]:hidden">
        {summary}
        <Plus
          aria-hidden
          className="size-5 shrink-0 transition-transform group-open:rotate-45"
        />
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  )
}

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { User } from "lucide-react"

import { cn } from "@/lib/utils"

interface AvatarProps {
  src?: string | null
  alt: string
  name?: string | null
  className?: string
  imageClassName?: string
}

export function Avatar({
  src,
  alt,
  name,
  className,
  imageClassName,
}: AvatarProps) {
  const initials = name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("")

  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted font-heading text-foreground",
        className,
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          alt={alt}
          className={cn("size-full object-cover", imageClassName)}
          src={src}
        />
      )}
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center">
        {initials || <User aria-hidden className="size-1/2" />}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

import { type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// A raised surface that "pops" above the page background. Used across the app
// for cards, info panels, form sections, and sidebars that need distinct
// visual elevation.
//
// Defaults to a `div` with border and card background. Pass `as` to render a
// semantic element (`section`, `aside`, `article`, etc.).

interface SurfaceProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

export function Surface({
  as: Component = "div",
  children,
  className,
}: SurfaceProps) {
  return (
    <Component
      className={cn(
        "border-2 border-border bg-card",
        // If no explicit padding class is set, default to p-5
        !className?.includes("p-") && "p-5",
        className,
      )}
    >
      {children}
    </Component>
  );
}

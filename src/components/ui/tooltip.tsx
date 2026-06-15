"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

interface TooltipProps {
  children: React.ReactElement
  content: React.ReactNode
}

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger render={children} />
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner sideOffset={8}>
            <TooltipPrimitive.Popup
              className="z-50 border-2 border-border bg-foreground px-2 py-1 text-sm text-background shadow-shadow"
              role="tooltip"
            >
              {content}
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

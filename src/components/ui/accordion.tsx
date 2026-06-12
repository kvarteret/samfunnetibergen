"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

export function Accordion({
  className,
  ...props
}: AccordionPrimitive.Root.Props<string>) {
  return (
    <AccordionPrimitive.Root
      className={cn("grid gap-4", className)}
      {...props}
    />
  )
}

export function AccordionItem({
  className,
  ...props
}: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      className={cn("panel p-0 shadow-shadow", className)}
      {...props}
    />
  )
}

export function AccordionTrigger({
  children,
  className,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left font-heading text-xl text-foreground focus-brutal",
          className,
        )}
        {...props}
      >
        {children}
        <Plus
          aria-hidden
          className="size-5 shrink-0 transition-transform group-data-panel-open:rotate-45"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

export function AccordionPanel({
  children,
  className,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel className={className} {...props}>
      <div className="px-5 pb-5">{children}</div>
    </AccordionPrimitive.Panel>
  )
}

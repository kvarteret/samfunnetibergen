import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import type * as React from "react"

import { cn } from "@/lib/utils"

/*
 * Table primitives in the site's own style: a soft card surface, no row
 * rules, numbers in the mono face. Logic (sorting, paging) lives with the
 * caller, typically TanStack Table.
 */

function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"table"> & { containerClassName?: string }) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "overflow-x-auto rounded-base bg-card shadow-shadow",
        containerClassName,
      )}
    >
      <table
        data-slot="table"
        className={cn("w-full border-collapse text-base", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader(props: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" {...props} />
}

function TableBody(props: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-colors [tbody_&]:hover:bg-secondary-50/60",
        className,
      )}
      {...props}
    />
  )
}

function TableHead({
  className,
  numeric = false,
  ...props
}: React.ComponentProps<"th"> & { numeric?: boolean }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "px-4 py-4 text-sm font-normal whitespace-nowrap text-foreground-muted first:pl-6 last:pr-6 sm:first:pl-7 sm:last:pr-7",
        numeric ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  )
}

function TableCell({
  className,
  numeric = false,
  ...props
}: React.ComponentProps<"td"> & { numeric?: boolean }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-4 first:pl-6 last:pr-6 sm:first:pl-7 sm:last:pr-7",
        numeric && "text-right font-mono text-[0.95rem] tabular-nums",
        className,
      )}
      {...props}
    />
  )
}

type SortDirection = false | "asc" | "desc"

/** A header button that shows and toggles a column's sort direction. */
function TableSortButton({
  direction,
  onToggle,
  numeric = false,
  children,
}: {
  direction: SortDirection
  onToggle?: (event: unknown) => void
  numeric?: boolean
  children: React.ReactNode
}) {
  const Icon =
    direction === "asc"
      ? ArrowUp
      : direction === "desc"
        ? ArrowDown
        : ChevronsUpDown
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded-base underline-offset-4 hover:text-foreground hover:underline focus-brutal",
        numeric && "flex-row-reverse",
        direction && "text-foreground",
      )}
    >
      {children}
      <Icon
        aria-hidden
        className={cn("size-3.5", !direction && "opacity-40")}
      />
    </button>
  )
}

/** `aria-sort` value for a header cell. */
function ariaSort(direction: SortDirection) {
  return direction === "asc"
    ? "ascending"
    : direction === "desc"
      ? "descending"
      : undefined
}

export {
  ariaSort,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSortButton,
}

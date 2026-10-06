"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { selectionControlVariants } from "@/components/ui/selection-control"
import { cn } from "@/lib/utils"

/** First, last and the pages around the current one; `null` marks a gap. */
export function pageNumbers(page: number, pageCount: number) {
  const pages = new Set([1, pageCount, page - 1, page, page + 1])
  const sorted = [...pages]
    .filter(entry => entry >= 1 && entry <= pageCount)
    .sort((a, b) => a - b)
  return sorted.flatMap((entry, index) =>
    index > 0 && entry - sorted[index - 1] > 1 ? [null, entry] : [entry],
  )
}

const round = (selected = false) =>
  cn(
    selectionControlVariants({ size: "square", selected }),
    "rounded-full font-mono font-normal",
  )

/** 1-based page controls with a "Viser x–y av n" summary. */
export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPage,
  className,
}: {
  page: number
  pageCount: number
  pageSize: number
  total: number
  onPage: (page: number) => void
  className?: string
}) {
  if (pageCount <= 1) return null
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)
  return (
    <nav
      aria-label="Sider"
      className={cn(
        "flex flex-wrap items-center justify-between gap-4",
        className,
      )}
    >
      <p className="text-sm text-foreground-muted">
        Viser{" "}
        <span className="font-mono">
          {first}–{last}
        </span>{" "}
        av <span className="font-mono">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Forrige side"
          className={round()}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        {pageNumbers(page, pageCount).map((entry, index) =>
          entry === null ? (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: gaps have no identity
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-foreground-muted"
            >
              …
            </span>
          ) : (
            <button
              type="button"
              key={entry}
              aria-current={entry === page ? "page" : undefined}
              className={round(entry === page)}
              onClick={() => onPage(entry)}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Neste side"
          className={round()}
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
    </nav>
  )
}

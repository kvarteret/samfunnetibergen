"use client";

import { cn } from "@/lib/utils";

export interface FilterButtonProps {
  isActive: boolean;
  label: string;
  onClick: () => void;
}

export function EventsPageFilterButton({ isActive, label, onClick }: FilterButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center border-2 border-border px-4 py-2 font-bold transition-colors",
        isActive
          ? "bg-foreground text-background"
          : "bg-muted text-foreground/80 hover:bg-card",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

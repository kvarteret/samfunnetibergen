import { Check, X } from "lucide-react"

import { DetailRow } from "@/components/ui/detail-row"

interface BoolSpecProps {
  value: boolean
  label: string
  details?: string | null
}

export function BoolSpec({ value, label, details }: BoolSpecProps) {
  return (
    <DetailRow label={label} layout="labelColumn">
      {value ? (
        <span className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <Check
              aria-hidden
              className="size-4 text-green-700 dark:text-green-400"
            />
            Ja
          </span>
          {details && (
            <span className="block max-w-xs text-foreground-muted">
              {details}
            </span>
          )}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-foreground-muted">
          <X aria-hidden className="size-4" />
          Nei
        </span>
      )}
    </DetailRow>
  )
}

"use client"

import { Check, Copy } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function BookingPromotionLink({ url }: { url: string }) {
  const t = useTranslations("RoomBooking")
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  return (
    <div className="space-y-2">
      <Button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setCopyFailed(false)
          } catch {
            setCopyFailed(true)
          }
        }}
        variant="outline"
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? t("form.promotionLinkCopied") : t("form.copyPromotionLink")}
      </Button>
      {copyFailed && (
        <Input
          aria-label={t("form.copyPromotionLink")}
          onFocus={event => event.target.select()}
          readOnly
          value={url}
        />
      )}
      <p aria-live="polite" className="text-sm text-foreground-muted">
        {t("form.promotionLinkHint")}
      </p>
    </div>
  )
}

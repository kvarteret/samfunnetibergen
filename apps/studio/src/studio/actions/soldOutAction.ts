import { useToast } from "@sanity/ui/toast"
import { useState } from "react"
import { type DocumentActionProps, useClient } from "sanity"

const API_VERSION = "2026-07-29"

/**
 * Sold out is a live fact, so it is written straight to the published
 * document (and any open draft) without publishing other pending edits.
 */
export function SoldOutAction(props: DocumentActionProps) {
  const client = useClient({ apiVersion: API_VERSION })
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const source = props.draft ?? props.published
  if (source?.approvalStatus !== "approved") return null

  const soldOut = source.isSoldOut === true
  return {
    disabled: busy,
    label: soldOut ? "Ikke utsolgt likevel" : "Marker som utsolgt",
    tone: soldOut ? ("default" as const) : ("caution" as const),
    onHandle: async () => {
      setBusy(true)
      try {
        const transaction = client.transaction()
        for (const document of [props.published, props.draft]) {
          if (document) {
            transaction.patch(document._id, patch =>
              patch.set({ isSoldOut: !soldOut }),
            )
          }
        }
        await transaction.commit()
        toast.push({
          status: "success",
          title: soldOut ? "Ikke lenger utsolgt" : "Markert som utsolgt",
        })
      } catch (error) {
        toast.push({
          status: "error",
          title: "Kunne ikke oppdatere arrangementet",
          description: error instanceof Error ? error.message : "Ukjent feil",
        })
      } finally {
        setBusy(false)
        props.onComplete()
      }
    },
  }
}

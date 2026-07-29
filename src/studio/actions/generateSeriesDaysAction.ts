import { icons } from "@sanity/icons"
import { useToast } from "@sanity/ui"
import { useState } from "react"
import type { DocumentActionProps } from "sanity"
import { useClient } from "sanity"

import {
  buildInstanceDocument,
  diffInstances,
  type ExistingInstance,
  expandOccurrences,
  type GenerationParent,
  type GenerationSeed,
  publishedIdOf,
} from "@/features/events/domain/instances"

const API_VERSION = "2026-07-29"
const EXISTING_DAYS_QUERY = `*[
  _type == "arrangement" &&
  eventKind == "seriesInstance" &&
  parentEvent._ref == $parentId &&
  !(_id in path("drafts.**"))
] {
  _id,
  eventStatus,
  approvalStatus,
  dates[]{startDate, startTime, endTime},
  "hasContentOverrides": count([
    defined(title), defined(description), defined(image),
    defined(imageCaption), defined(organizerGroup), defined(organizerText),
    defined(eventType), defined(isFree), defined(priceOrdinar),
    defined(priceStudent), defined(priceMedlem), defined(ticketUrl),
    defined(facebookUrl), defined(isInternalEvent)
  ][@ == true]) > 0
}`

type Plan = {
  parent: GenerationParent
  seed: GenerationSeed
  occurrences: ReturnType<typeof expandOccurrences>
  diff: ReturnType<typeof diffInstances>
}

export function GenerateSeriesDaysAction(props: DocumentActionProps) {
  const client = useClient({ apiVersion: API_VERSION })
  const toast = useToast()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [busy, setBusy] = useState(false)
  const source = (props.draft ?? props.published) as Record<
    string,
    unknown
  > | null

  if (source?.eventKind !== "seriesParent") return null

  const rrule = typeof source.rrule === "string" ? source.rrule : ""
  const slug =
    typeof (source.slug as { current?: unknown } | undefined)?.current ===
    "string"
      ? (source.slug as { current: string }).current
      : ""
  const seed = (
    Array.isArray(source.dates) ? source.dates[0] : null
  ) as GenerationSeed | null

  const prepare = async () => {
    if (!rrule || !slug || !seed?.startDate) {
      toast.push({
        status: "warning",
        title: "Fullfør gjentakelsen først",
        description:
          "Serien trenger nettadresse, første dato og et gjentakelsesmønster.",
      })
      return
    }
    setBusy(true)
    const parent: GenerationParent = {
      _id: publishedIdOf(props.id),
      slug,
      approvalStatus:
        source.approvalStatus === "approved" ? "approved" : "pending",
    }
    const occurrences = expandOccurrences(rrule, seed)
    const existing = await client.fetch<ExistingInstance[]>(
      EXISTING_DAYS_QUERY,
      { parentId: parent._id },
      { perspective: "raw" },
    )
    setPlan({
      parent,
      seed,
      occurrences,
      diff: diffInstances(parent, occurrences, existing, seed),
    })
    setBusy(false)
  }

  const write = async () => {
    if (!plan) return
    setBusy(true)
    const transaction = client.transaction()
    for (const occurrence of plan.diff.toCreate) {
      transaction.createIfNotExists(
        buildInstanceDocument(plan.parent, occurrence),
      )
    }
    await transaction.commit()
    toast.push({
      status: "success",
      title: `${plan.diff.toCreate.length} dager opprettet`,
    })
    setPlan(null)
    setBusy(false)
    props.onComplete()
  }

  return {
    label: busy ? "Arbeider …" : "Opprett eller oppdater dager",
    icon: icons.calendar,
    disabled: busy,
    onHandle: () => void prepare(),
    dialog: plan
      ? {
          type: "confirm" as const,
          tone: "positive" as const,
          onCancel: () => setPlan(null),
          onConfirm: () => void write(),
          message:
            `${plan.occurrences.length} dager følger mønsteret. ` +
            `${plan.diff.toCreate.length} opprettes, ` +
            `${plan.occurrences.length - plan.diff.toCreate.length} finnes allerede. ` +
            `${plan.diff.orphanedUntouched.length} tidligere dager følger ikke lenger mønsteret, ` +
            `og ${plan.diff.orphanedEdited.length} av disse er redigert og må vurderes manuelt. ` +
            "Ingen eksisterende eller redigerte dager overskrives eller slettes.",
        }
      : null,
  }
}

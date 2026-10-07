import {
  buildInstanceDocument,
  diffInstances,
  type ExistingInstance,
  expandOccurrencesInRange,
  type GenerationParent,
  type GenerationSeed,
  type SemesterWindow,
  semesterWindowsAround,
} from "@samfunnet/content-domain/instances"
import { Badge, Button, Card, Flex, Stack, Text } from "@sanity/ui"
import { useToast } from "@sanity/ui/toast"
import { useState } from "react"
import { useClient } from "sanity"

import { formatStudioDate, todayInOslo } from "./arrangementFilters"

const API_VERSION = "2026-07-29"
const EXISTING_DAYS_QUERY = `*[
  _type == "arrangement" &&
  eventKind == "seriesInstance" &&
  parentEvent._ref == $parentId &&
  count(dates[startDate >= $rangeStart && startDate <= $rangeEnd]) > 0 &&
  !(_id in path("drafts.**"))
] {
  _id,
  eventStatus,
  approvalStatus,
  dates[]{startDate, startTime, endTime},
  "hasContentOverrides": count([
    defined(localizedTitle), defined(localizedDescription), defined(image),
    defined(localizedImageCaption), defined(organizerGroup), defined(localizedOrganizerText),
    defined(eventType), defined(isFree), defined(priceOrdinar),
    defined(priceStudent), defined(priceMedlem), defined(ticketUrl),
    defined(facebookUrl), defined(isInternalEvent)
  ][@ == true]) > 0
}`

type Plan = {
  parent: GenerationParent
  seed: GenerationSeed
  semester: SemesterWindow
  occurrences: ReturnType<typeof expandOccurrencesInRange>
  diff: ReturnType<typeof diffInstances>
}

type SeriesSemesterExpansionProps = {
  approvalStatus: "approved" | "pending"
  documentId: string
  rrule: string
  seed: GenerationSeed | null
  slug: string
}

export function SeriesSemesterExpansion({
  approvalStatus,
  documentId,
  rrule,
  seed,
  slug,
}: SeriesSemesterExpansionProps) {
  const client = useClient({ apiVersion: API_VERSION })
  const toast = useToast()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [busy, setBusy] = useState(false)

  const today = todayInOslo()
  const ready = Boolean(documentId && rrule && slug && seed?.startDate)
  const semesters = seed?.startDate
    ? semesterWindowsAround(seed.startDate > today ? seed.startDate : today)
        .filter(semester => semester.endDate >= today)
        .slice(0, 2)
    : []

  const prepare = async (semester: SemesterWindow) => {
    if (!seed) return
    setBusy(true)
    try {
      const parent: GenerationParent = {
        _id: documentId,
        slug,
        approvalStatus,
      }
      const occurrences = expandOccurrencesInRange(rrule, seed, semester)
      const existing = await client.fetch<ExistingInstance[]>(
        EXISTING_DAYS_QUERY,
        {
          parentId: documentId,
          rangeStart: semester.startDate,
          rangeEnd: semester.endDate,
        },
        { perspective: "raw" },
      )
      setPlan({
        parent,
        seed,
        semester,
        occurrences,
        diff: diffInstances(parent, occurrences, existing, seed),
      })
    } catch {
      toast.push({
        status: "error",
        title: "Kunne ikke kontrollere seriedagene",
      })
    } finally {
      setBusy(false)
    }
  }

  const write = async () => {
    if (!plan) return
    setBusy(true)
    try {
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
    } catch {
      toast.push({
        status: "error",
        title: "Kunne ikke opprette seriedagene",
      })
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return (
      <Text muted size={1}>
        Fyll inn første dato og nettadresse for å opprette dager.
      </Text>
    )
  }

  const created = plan?.diff.toCreate.length ?? 0
  const orphaned =
    (plan?.diff.orphanedUntouched.length ?? 0) +
    (plan?.diff.orphanedEdited.length ?? 0)

  return (
    <Card border padding={3} radius={2}>
      <Stack gap={3}>
        <Flex align="center" gap={2} wrap="wrap">
          <Text size={1} weight="semibold">
            Opprett dager for
          </Text>
          {semesters.map(semester => (
            <Button
              disabled={busy}
              fontSize={1}
              key={semester.code}
              mode={plan?.semester.code === semester.code ? "default" : "ghost"}
              onClick={() => void prepare(semester)}
              text={semesterName(semester)}
              title={`${formatStudioDate(semester.startDate, false)}–${formatStudioDate(semester.endDate, false)}`}
            />
          ))}
        </Flex>
        {plan ? (
          <Stack gap={3}>
            {created ? (
              <Flex gap={1} wrap="wrap">
                {plan.diff.toCreate.map(occurrence => (
                  <Badge key={occurrence.startDate} tone="positive">
                    {formatStudioDate(occurrence.startDate)}
                  </Badge>
                ))}
              </Flex>
            ) : (
              <Text muted size={1}>
                Alle dagene finnes allerede.
              </Text>
            )}
            {orphaned ? (
              <Text muted size={1}>
                {orphaned} eksisterende dager følger ikke lenger mønsteret. De
                beholdes.
              </Text>
            ) : null}
            {created ? (
              <Flex gap={2}>
                <Button
                  loading={busy}
                  onClick={() => void write()}
                  text={`Opprett ${created} dager`}
                  tone="positive"
                />
                <Button
                  disabled={busy}
                  mode="bleed"
                  onClick={() => setPlan(null)}
                  text="Avbryt"
                />
              </Flex>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  )
}

function semesterName(semester: SemesterWindow): string {
  const year = semester.startDate.slice(0, 4)
  return `${semester.code.startsWith("H") ? "Høst" : "Vår"} ${year}`
}

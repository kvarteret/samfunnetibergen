import { Button, Card, Dialog, Flex, Stack, Text, useToast } from "@sanity/ui"
import { useState } from "react"
import { useClient } from "sanity"

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
  const [selectingSemester, setSelectingSemester] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [busy, setBusy] = useState(false)

  const openSemesterPicker = () => {
    if (!documentId || !rrule || !slug || !seed?.startDate) {
      toast.push({
        status: "warning",
        title: "Fullfør gjentakelsen først",
        description:
          "Serien trenger nettadresse, første dato og et gjentakelsesmønster.",
      })
      return
    }
    setSelectingSemester(true)
  }

  const prepare = async (semester: SemesterWindow) => {
    if (!seed) return
    setSelectingSemester(false)
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
        title: `${plan.diff.toCreate.length} dager opprettet for ${plan.semester.code}`,
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

  return (
    <>
      <Card border padding={3} radius={2}>
        <Stack space={3}>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Semesterutvidelse
            </Text>
            <Text muted size={1}>
              Velg programperioden som skal få egne, redigerbare seriedager.
            </Text>
          </Stack>
          <Button
            disabled={busy}
            loading={busy}
            mode="ghost"
            onClick={openSemesterPicker}
            text="Velg semester og kontroller dager"
          />
        </Stack>
      </Card>

      {selectingSemester && seed ? (
        <Dialog
          header="Velg semester"
          id="series-semester-picker"
          onClose={() => setSelectingSemester(false)}
          width={1}
        >
          <SemesterPicker
            onSelect={semester => void prepare(semester)}
            seedDate={seed.startDate}
          />
        </Dialog>
      ) : null}

      {plan ? (
        <Dialog
          footer={
            <Flex gap={2} justify="flex-end" padding={3}>
              <Button
                disabled={busy}
                mode="bleed"
                onClick={() => setPlan(null)}
                text="Avbryt"
              />
              <Button
                disabled={busy}
                loading={busy}
                onClick={() => void write()}
                text="Opprett manglende dager"
                tone="positive"
              />
            </Flex>
          }
          header={`${plan.semester.code}: Kontroller dager`}
          id="series-semester-preview"
          onClose={() => setPlan(null)}
          width={1}
        >
          <Card padding={4}>
            <Text size={1}>{planMessage(plan)}</Text>
          </Card>
        </Dialog>
      ) : null}
    </>
  )
}

function SemesterPicker({
  onSelect,
  seedDate,
}: {
  onSelect: (semester: SemesterWindow) => void
  seedDate: string
}) {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
  }).format(new Date())
  const referenceDate = seedDate > today ? seedDate : today
  const semesters = semesterWindowsAround(referenceDate)

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Text muted size={1}>
          Velg programperioden som skal opprettes eller oppdateres.
        </Text>
        <Flex gap={2} wrap="wrap">
          {semesters.map(semester => (
            <Button
              key={semester.code}
              mode="ghost"
              onClick={() => onSelect(semester)}
              text={`${semester.code} · ${compactDate(semester.startDate)}–${compactDate(semester.endDate)}`}
              title={`${semester.label}: ${semester.startDate}–${semester.endDate}`}
            />
          ))}
        </Flex>
      </Stack>
    </Card>
  )
}

function planMessage(plan: Plan): string {
  return (
    `${plan.semester.label} (${plan.semester.startDate}–${plan.semester.endDate}): ` +
    `${plan.occurrences.length} dager følger mønsteret. ` +
    `${plan.diff.toCreate.length} opprettes, ` +
    `${plan.occurrences.length - plan.diff.toCreate.length} finnes allerede. ` +
    `${plan.diff.orphanedUntouched.length} tidligere dager følger ikke lenger mønsteret, ` +
    `og ${plan.diff.orphanedEdited.length} av disse er redigert og må vurderes manuelt. ` +
    "Ingen eksisterende eller redigerte dager overskrives eller slettes."
  )
}

function compactDate(date: string): string {
  const [, month, day] = date.split("-")
  return `${day}.${month}`
}

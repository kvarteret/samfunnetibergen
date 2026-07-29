import { Card, Checkbox, Flex, Select, Stack, Text } from "@sanity/ui"
import { useEffect, useMemo, useState } from "react"
import { RRule } from "rrule"
import type { BooleanInputProps } from "sanity"
import {
  set,
  unset,
  useClient,
  useDocumentOperation,
  useFormValue,
} from "sanity"

import type { GenerationSeed } from "@/features/events/domain/instances"

import { SeriesSemesterExpansion } from "./SeriesSemesterExpansion"

const API_VERSION = "2026-07-29"
const WEEKDAYS = [
  ["MO", "Mandag"],
  ["TU", "Tirsdag"],
  ["WE", "Onsdag"],
  ["TH", "Torsdag"],
  ["FR", "Fredag"],
  ["SA", "Lørdag"],
  ["SU", "Søndag"],
] as const

type RecurrenceFields = {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY"
  interval: number
  weekdays: string[]
}

function readRule(value: unknown): RecurrenceFields {
  if (typeof value !== "string" || !value) {
    return { frequency: "WEEKLY", interval: 1, weekdays: ["MO"] }
  }
  try {
    const parsed = RRule.parseString(value)
    const frequency =
      parsed.freq === RRule.DAILY
        ? "DAILY"
        : parsed.freq === RRule.MONTHLY
          ? "MONTHLY"
          : "WEEKLY"
    return {
      frequency,
      interval: parsed.interval ?? 1,
      weekdays: parsed.byweekday
        ? (Array.isArray(parsed.byweekday)
            ? parsed.byweekday
            : [parsed.byweekday]
          ).map(day =>
            typeof day === "number" ? WEEKDAYS[day]?.[0] : String(day),
          )
        : ["MO"],
    }
  } catch {
    return { frequency: "WEEKLY", interval: 1, weekdays: ["MO"] }
  }
}

export function serializeEditorialRecurrence(fields: RecurrenceFields): string {
  const parts = [`FREQ=${fields.frequency}`]
  if (fields.interval > 1) {
    parts.push(`INTERVAL=${fields.interval}`)
  }
  if (fields.frequency === "WEEKLY" && fields.weekdays.length > 0) {
    parts.push(`BYDAY=${fields.weekdays.join(",")}`)
  }
  return parts.join(";")
}

export function documentOperationId(id: string): string {
  return id.replace(/^drafts\./, "")
}

export function RecurringInput(props: BooleanInputProps) {
  const id = String(useFormValue(["_id"]) ?? "")
  const operationId = documentOperationId(id)
  const storedRule = useFormValue(["rrule"])
  const storedDates = useFormValue(["dates"])
  const storedSlug = useFormValue(["slug"])
  const approvalStatus = useFormValue(["approvalStatus"])
  const client = useClient({ apiVersion: API_VERSION })
  const operations = useDocumentOperation(operationId, "arrangement")
  const [childCount, setChildCount] = useState(0)
  const fields = useMemo(() => readRule(storedRule), [storedRule])
  const seed = (
    Array.isArray(storedDates) ? storedDates[0] : null
  ) as GenerationSeed | null
  const slug =
    typeof (storedSlug as { current?: unknown } | undefined)?.current ===
    "string"
      ? (storedSlug as { current: string }).current
      : ""

  useEffect(() => {
    if (!id) return
    void client
      .fetch<number>(
        'count(*[_type == "arrangement" && parentEvent._ref == $id])',
        { id: operationId },
        { perspective: "raw" },
      )
      .then(setChildCount)
  }, [client, id, operationId])

  const patchRule = (next: RecurrenceFields) => {
    operations.patch.execute([
      { set: { rrule: serializeEditorialRecurrence(next) } },
    ])
  }

  const toggle = (checked: boolean) => {
    if (!checked && childCount > 0) return
    props.onChange(checked ? set(true) : unset())
    operations.patch.execute([
      {
        set: checked
          ? {
              eventKind: "seriesParent",
              rrule:
                typeof storedRule === "string" && storedRule
                  ? storedRule
                  : serializeEditorialRecurrence(fields),
            }
          : { eventKind: "single" },
      },
      ...(checked ? [] : [{ unset: ["rrule"] }]),
    ])
  }

  return (
    <Card border padding={3} radius={2}>
      <Stack space={4}>
        <Flex align="center" gap={3}>
          <Checkbox
            checked={Boolean(props.value)}
            disabled={Boolean(props.readOnly) || childCount > 0}
            onChange={event => toggle(event.currentTarget.checked)}
          />
          <Stack flex={1} space={2}>
            <Text weight="semibold">Gjentakelse</Text>
            <Text muted size={1}>
              Opprett en serie med egne dager som kan redigeres hver for seg.
            </Text>
          </Stack>
        </Flex>
        {childCount > 0 ? (
          <Text muted size={1}>
            Gjentakelse kan ikke slås av fordi serien har {childCount} dager.
            Åpne serien fra «Recurring» for å se dagene.
          </Text>
        ) : null}
        {props.value ? (
          <Stack space={3}>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                Mønster
              </Text>
              <Select
                aria-label="Hvor ofte"
                onChange={event =>
                  patchRule({
                    ...fields,
                    frequency: event.currentTarget
                      .value as RecurrenceFields["frequency"],
                  })
                }
                value={fields.frequency}
              >
                <option value="DAILY">Hver dag</option>
                <option value="WEEKLY">Hver uke</option>
                <option value="MONTHLY">Hver måned</option>
              </Select>
            </Stack>
            {fields.frequency === "WEEKLY" ? (
              <Flex gap={3} wrap="wrap">
                {WEEKDAYS.map(([value, label]) => (
                  <Flex align="center" gap={2} key={value}>
                    <Checkbox
                      checked={fields.weekdays.includes(value)}
                      onChange={event =>
                        patchRule({
                          ...fields,
                          weekdays: event.currentTarget.checked
                            ? [...fields.weekdays, value]
                            : fields.weekdays.filter(day => day !== value),
                        })
                      }
                    />
                    <Text size={1}>{label}</Text>
                  </Flex>
                ))}
              </Flex>
            ) : null}
            <Stack space={2}>
              <Text muted size={1}>
                Første dato over forankrer mønsteret.
              </Text>
            </Stack>
            <SeriesSemesterExpansion
              approvalStatus={
                approvalStatus === "approved" ? "approved" : "pending"
              }
              documentId={operationId}
              rrule={typeof storedRule === "string" ? storedRule : ""}
              seed={seed}
              slug={slug}
            />
          </Stack>
        ) : null}
      </Stack>
    </Card>
  )
}

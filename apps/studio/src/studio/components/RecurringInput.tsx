import type { GenerationSeed } from "@samfunnet/content-domain/instances"
import { Checkbox, Flex, Select, Stack, Text } from "@sanity/ui"
import { useMemo } from "react"
import { RRule } from "rrule"
import type { BooleanInputProps } from "sanity"
import { useDocumentOperation, useFormValue } from "sanity"

import { SeriesSemesterExpansion } from "./SeriesSemesterExpansion"

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

export function RecurringInput(_props: BooleanInputProps) {
  const id = String(useFormValue(["_id"]) ?? "")
  const operationId = documentOperationId(id)
  const storedRule = useFormValue(["rrule"])
  const storedDates = useFormValue(["dates"])
  const storedSlug = useFormValue(["slug"])
  const approvalStatus = useFormValue(["approvalStatus"])
  const operations = useDocumentOperation(operationId, "arrangement")
  const fields = useMemo(() => readRule(storedRule), [storedRule])
  const seed = (
    Array.isArray(storedDates) ? storedDates[0] : null
  ) as GenerationSeed | null
  const slug =
    typeof (storedSlug as { current?: unknown } | undefined)?.current ===
    "string"
      ? (storedSlug as { current: string }).current
      : ""

  const patchRule = (next: RecurrenceFields) => {
    operations.patch.execute([
      { set: { rrule: serializeEditorialRecurrence(next) } },
    ])
  }

  return (
    <Stack gap={4}>
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
      {fields.frequency === "WEEKLY" ? (
        <Flex gap={3} wrap="wrap">
          {WEEKDAYS.map(([value, label]) => (
            <Flex align="center" as="label" gap={2} key={value}>
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
      <SeriesSemesterExpansion
        approvalStatus={approvalStatus === "approved" ? "approved" : "pending"}
        documentId={operationId}
        rrule={typeof storedRule === "string" ? storedRule : ""}
        seed={seed}
        slug={slug}
      />
    </Stack>
  )
}

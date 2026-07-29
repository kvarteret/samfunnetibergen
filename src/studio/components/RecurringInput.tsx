import {
  Box,
  Card,
  Checkbox,
  Flex,
  Select,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui"
import { useEffect, useMemo, useState } from "react"
import type { BooleanInputProps } from "sanity"
import {
  set,
  unset,
  useClient,
  useDocumentOperation,
  useFormValue,
} from "sanity"
import { RRule } from "rrule"

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
  weekdays: string[]
  until: string
}

function readRule(value: unknown): RecurrenceFields {
  if (typeof value !== "string" || !value) {
    return { frequency: "WEEKLY", weekdays: ["MO"], until: "" }
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
      weekdays: parsed.byweekday
        ? (Array.isArray(parsed.byweekday)
            ? parsed.byweekday
            : [parsed.byweekday]
          ).map(day =>
            typeof day === "number" ? WEEKDAYS[day]?.[0] : String(day),
          )
        : ["MO"],
      until: parsed.until?.toISOString().slice(0, 10) ?? "",
    }
  } catch {
    return { frequency: "WEEKLY", weekdays: ["MO"], until: "" }
  }
}

export function serializeEditorialRecurrence(fields: RecurrenceFields): string {
  const parts = [`FREQ=${fields.frequency}`]
  if (fields.frequency === "WEEKLY" && fields.weekdays.length > 0) {
    parts.push(`BYDAY=${fields.weekdays.join(",")}`)
  }
  if (fields.until) {
    parts.push(`UNTIL=${fields.until.replaceAll("-", "")}T235959Z`)
  }
  return parts.join(";")
}

export function RecurringInput(props: BooleanInputProps) {
  const id = String(useFormValue(["_id"]) ?? "")
  const storedRule = useFormValue(["rrule"])
  const client = useClient({ apiVersion: API_VERSION })
  const operations = useDocumentOperation(id, "arrangement")
  const [childCount, setChildCount] = useState(0)
  const fields = useMemo(() => readRule(storedRule), [storedRule])

  useEffect(() => {
    if (!id) return
    void client
      .fetch<number>(
        'count(*[_type == "arrangement" && parentEvent._ref == $id])',
        { id: id.replace(/^drafts\./, "") },
        { perspective: "raw" },
      )
      .then(setChildCount)
  }, [client, id])

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
          <Box flex={1}>
            <Text weight="semibold">Gjentakelse</Text>
            <Text muted size={1}>
              Opprett en serie med egne dager som kan redigeres hver for seg.
            </Text>
          </Box>
        </Flex>
        {childCount > 0 ? (
          <Text muted size={1}>
            Gjentakelse kan ikke slås av fordi serien har {childCount} dager.
            Åpne serien fra «recurring» for å se dagene.
          </Text>
        ) : null}
        {props.value ? (
          <Stack space={3}>
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
            <TextInput
              aria-label="Sluttdato"
              onChange={event =>
                patchRule({ ...fields, until: event.currentTarget.value })
              }
              type="date"
              value={fields.until}
            />
            <Text muted size={1}>
              Serien kan maksimalt opprette dager seks måneder frem i tid.
            </Text>
          </Stack>
        ) : null}
      </Stack>
    </Card>
  )
}

import { useEffect } from "react"
import {
  type ArrayOfObjectsInputProps,
  type ArraySchemaType,
  set,
  useFormValue,
} from "sanity"

type DateArraySchema = ArraySchemaType & {
  options?: ArraySchemaType["options"]
}

// Series, series days and festival days have exactly one date.
const SINGLE_DATE_KINDS = new Set([
  "seriesParent",
  "seriesInstance",
  "festivalSession",
])

const osloParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

/** Today's date and the current time in Oslo. */
function osloNow() {
  const part = (type: string) =>
    osloParts.formatToParts(new Date()).find(p => p.type === type)?.value
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  }
}

export function ArrangementDatesInput(
  props: ArrayOfObjectsInputProps<{ _key: string }, DateArraySchema>,
) {
  const eventKind = useFormValue(["eventKind"])
  const infoScreenOnly = useFormValue(["infoScreenOnly"]) === true
  const { value, onChange } = props
  const first = Array.isArray(value)
    ? (value[0] as
        | { _key: string; startDate?: string; startTime?: string }
        | undefined)
    : undefined

  // "Kun infoskjerm" is always today; the start time is prefilled with now.
  useEffect(() => {
    if (!infoScreenOnly) return
    const now = osloNow()
    if (first?.startDate === now.date && first.startTime) return
    onChange(
      set([
        {
          ...first,
          _key: first?._key ?? "info-screen-date",
          _type: "arrangementDate",
          startDate: now.date,
          startTime: first?.startTime || now.time,
        },
      ]),
    )
  }, [infoScreenOnly, first, onChange])

  const hasSeriesSeed =
    SINGLE_DATE_KINDS.has(String(eventKind)) &&
    Array.isArray(props.value) &&
    props.value.length > 0

  if (!hasSeriesSeed) return props.renderDefault(props)

  const disableActions = new Set(props.schemaType.options?.disableActions ?? [])
  for (const action of ["add", "addBefore", "addAfter", "duplicate"] as const) {
    disableActions.add(action)
  }

  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      options: {
        ...props.schemaType.options,
        disableActions: [...disableActions],
      },
    },
  })
}

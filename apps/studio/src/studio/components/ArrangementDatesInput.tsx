import {
  type ArrayOfObjectsInputProps,
  type ArraySchemaType,
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

export function ArrangementDatesInput(
  props: ArrayOfObjectsInputProps<{ _key: string }, DateArraySchema>,
) {
  const eventKind = useFormValue(["eventKind"])
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

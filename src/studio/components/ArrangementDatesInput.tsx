import {
  type ArrayOfObjectsInputProps,
  type ArraySchemaType,
  useFormValue,
} from "sanity"

type DateArraySchema = ArraySchemaType & {
  options?: ArraySchemaType["options"]
}

/**
 * A recurring series has one seed date. Keep the normal array input while it
 * is empty, then hide actions that could add a second date. Other arrangement
 * kinds retain Sanity's standard multi-date input.
 */
export function ArrangementDatesInput(
  props: ArrayOfObjectsInputProps<{ _key: string }, DateArraySchema>,
) {
  const eventKind = useFormValue(["eventKind"])
  const hasSeriesSeed =
    eventKind === "seriesParent" &&
    Array.isArray(props.value) &&
    props.value.length > 0

  if (!hasSeriesSeed) return props.renderDefault(props)

  const disableActions = new Set(props.schemaType.options?.disableActions ?? [])
  disableActions.add("add")
  disableActions.add("duplicate")

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

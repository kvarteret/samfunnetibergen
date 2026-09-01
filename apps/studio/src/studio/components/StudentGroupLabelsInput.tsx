import { Autocomplete, Card, Flex, Stack, Text } from "@sanity/ui"
import { useMemo, useState } from "react"
import { type StringInputProps, set, useFormValue } from "sanity"

export const STUDENT_GROUP_LABEL_OPTIONS = {
  nb: ["Bar", "Drift", "Kultur", "Kunnskap"],
  en: ["Bar", "Culture", "Knowledge", "Operation"],
} as const

type StudentGroupLabelLanguage = keyof typeof STUDENT_GROUP_LABEL_OPTIONS

export function parseStudentGroupLabels(value: string | undefined): string[] {
  if (!value) return []
  return [
    ...new Set(
      value
        .split(/\r?\n/)
        .map(label => label.trim())
        .filter(Boolean),
    ),
  ]
}

function getLanguage(value: unknown): StudentGroupLabelLanguage {
  return value === "en" ? "en" : "nb"
}

export function StudentGroupLabelsInput(props: StringInputProps) {
  const language = getLanguage(
    useFormValue([...props.path.slice(0, -1), "language"]),
  )
  const selectedLabels = parseStudentGroupLabels(props.value)
  const [query, setQuery] = useState("")

  const options = useMemo(() => {
    const knownOptions = [...STUDENT_GROUP_LABEL_OPTIONS[language]]
    const knownOptionSet = new Set<string>(knownOptions)
    const legacyOptions = selectedLabels.filter(
      label => !knownOptionSet.has(label),
    )
    return [...new Set([...knownOptions, ...legacyOptions])].map(label => ({
      title: label,
      value: label,
    }))
  }, [language, selectedLabels.join("\n")])

  const updateLabels = (nextLabels: string[]) => {
    props.onChange(set(nextLabels.join("\n")))
    setQuery("")
  }

  return (
    <Stack space={2}>
      {selectedLabels.length > 0 ? (
        <Flex gap={2} wrap="wrap">
          {selectedLabels.map(label => (
            <Card key={label} border padding={2} radius={2} tone="primary">
              <Text
                as="button"
                size={1}
                style={{
                  background: "none",
                  border: 0,
                  cursor: "pointer",
                  padding: 0,
                }}
                type="button"
                onClick={() =>
                  updateLabels(selectedLabels.filter(item => item !== label))
                }
                title={`Fjern ${label}`}
              >
                {label} ×
              </Text>
            </Card>
          ))}
        </Flex>
      ) : null}
      <Autocomplete
        border
        id={props.id}
        openButton
        openOnFocus
        options={options}
        placeholder="Velg etiketter …"
        value={query}
        filterOption={(search, option) =>
          option.title
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase()) &&
          !selectedLabels.includes(option.value)
        }
        onChange={setQuery}
        onSelect={selected => {
          if (!selectedLabels.includes(selected)) {
            updateLabels([...selectedLabels, selected])
          }
        }}
      />
      <Text muted size={1}>
        Velg én eller flere etiketter. Klikk på en valgt etikett for å fjerne
        den.
      </Text>
    </Stack>
  )
}

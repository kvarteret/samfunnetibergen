"use client"

import { icons } from "@sanity/icons"
import {
  Autocomplete,
  type BaseAutocompleteOption,
  Card,
  Stack,
  Text,
} from "@sanity/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ObjectInputMember,
  type ObjectInputProps,
  PatchEvent,
  set,
  setIfMissing,
  unset,
  useClient,
} from "sanity"
import { getPublishedDocumentId } from "../../contentPolicies"
import {
  buildDestinationPatches,
  getDestinationValue,
  parseDestinationInput,
  type SourceLinkValue,
} from "./sourceLinkDestination"

type DocumentOption = BaseAutocompleteOption & {
  title: string
  subtitle: string
}

const documentTypes = [
  "homePage",
  "roomsPage",
  "groupsPage",
  "sponsorsPage",
  "kontaktPage",
  "page",
  "arrangement",
  "room",
  "studentGroup",
]

const documentSearchQuery = `*[
  _type in $types &&
  !(_id in path("versions.**")) &&
  (
    lower(coalesce(title, name, "")) match $search ||
    lower(coalesce(slug.current, "")) match $search
  )
][0...30] | order(coalesce(title, name) asc) {
  "value": "document:" + select(
    _id in path("drafts.**") => string::split(_id, "drafts.")[1],
    _id
  ),
  "title": coalesce(title, name, "Dokument uten tittel"),
  "subtitle": select(
    defined(slug.current) => "/" + slug.current,
    _type
  )
}`

function toPatchEvent(value: SourceLinkValue | undefined, destination: string) {
  const parsedDestination = parseDestinationInput(destination)
  const patches = buildDestinationPatches(parsedDestination).map(patch =>
    patch.type === "set" ? set(patch.value, [patch.path]) : unset([patch.path]),
  )

  return PatchEvent.from([
    ...(value ? [] : [setIfMissing({ _type: "sourceLink" })]),
    ...patches,
  ])
}

export function SourceLinkInput(props: ObjectInputProps<SourceLinkValue>) {
  const { members, onChange, value } = props
  const client = useClient({ apiVersion: "2025-02-19" })
  const labelMember = members.find(
    member => member.kind === "field" && member.name === "label",
  )
  const storedValue = getDestinationValue(value)
  const [inputState, setInputState] = useState(() => ({
    storedValue,
    inputValue: storedValue,
  }))
  const inputValue =
    inputState.storedValue === storedValue ? inputState.inputValue : storedValue
  const [options, setOptions] = useState<DocumentOption[]>([])
  const [loading, setLoading] = useState(false)
  const documentId = value?.internalPage?._ref
  const [documentTitleResult, setDocumentTitleResult] = useState<{
    documentId: string
    title: string | null
  } | null>(null)
  const documentTitle =
    documentTitleResult && documentTitleResult.documentId === documentId
      ? documentTitleResult.title
      : null

  useEffect(() => {
    if (!documentId) {
      return
    }

    client
      .fetch<string | null>(
        `coalesce(*[_id == $id][0].title, *[_id == $id][0].name)`,
        { id: documentId },
      )
      .then(title => setDocumentTitleResult({ documentId, title }))
      .catch(() => setDocumentTitleResult({ documentId, title: null }))
  }, [client, documentId])

  const renderProps = useMemo(
    () => ({
      renderField: props.renderField,
      renderInput: props.renderInput,
      renderItem: props.renderItem,
      renderPreview: props.renderPreview,
    }),
    [
      props.renderField,
      props.renderInput,
      props.renderItem,
      props.renderPreview,
    ],
  )

  const searchDocuments = useCallback(
    async (query: string | null) => {
      const search = `${(query ?? "").trim().toLowerCase()}*`
      setLoading(true)
      try {
        const results = await client.fetch<DocumentOption[]>(
          documentSearchQuery,
          { types: documentTypes, search },
          { perspective: "drafts" },
        )
        setOptions(results)
      } finally {
        setLoading(false)
      }
    },
    [client],
  )

  const applyTypedDestination = useCallback(
    (nextValue: string) => {
      const trimmedValue = nextValue.trim()
      if (trimmedValue && !parseDestinationInput(trimmedValue)) {
        return
      }
      onChange(toPatchEvent(value, trimmedValue))
    },
    [onChange, value],
  )

  const handleSelect = useCallback(
    (selectedValue: string) => {
      if (!selectedValue.startsWith("document:")) {
        return
      }

      const documentId = getPublishedDocumentId(
        selectedValue.slice("document:".length),
      )
      onChange(
        PatchEvent.from([
          ...(value ? [] : [setIfMissing({ _type: "sourceLink" })]),
          ...buildDestinationPatches({
            kind: "internalDocument",
            documentId,
          }).map(patch =>
            patch.type === "set"
              ? set(patch.value, [patch.path])
              : unset([patch.path]),
          ),
        ]),
      )
      setInputState({ storedValue, inputValue: selectedValue })
    },
    [onChange, storedValue, value],
  )

  if (!labelMember) {
    return props.renderDefault(props)
  }

  return (
    <Stack space={4}>
      <ObjectInputMember member={labelMember} {...renderProps} />
      <Stack space={2}>
        <Text
          as="label"
          htmlFor={`${props.id}-destination`}
          size={1}
          weight="medium"
        >
          Destinasjon
        </Text>
        <Autocomplete<DocumentOption>
          filterOption={() => true}
          icon={storedValue.startsWith("document:") ? icons.link : icons.search}
          id={`${props.id}-destination`}
          loading={loading}
          onBlur={() => applyTypedDestination(inputValue)}
          onChange={nextValue => {
            setInputState({ storedValue, inputValue: nextValue })
            if (!nextValue) {
              applyTypedDestination("")
            }
          }}
          onFocus={() => searchDocuments("")}
          onQueryChange={searchDocuments}
          onSelect={handleSelect}
          openButton
          options={options}
          placeholder="Søk etter dokument eller lim inn /sti, URL, mailto: eller tel:"
          renderOption={option => (
            <Card padding={3} radius={2}>
              <Stack space={2}>
                <Text size={1} weight="medium">
                  {option.title}
                </Text>
                <Text muted size={1}>
                  {option.subtitle}
                </Text>
              </Stack>
            </Card>
          )}
          renderValue={currentValue => {
            if (currentValue.startsWith("document:")) {
              return documentTitle ?? "Valgt Sanity-dokument"
            }
            return currentValue
          }}
          value={inputValue}
        />
        <Text muted size={1}>
          Velg et Sanity-dokument, eller bruk en intern sti, HTTP(S), mailto:
          eller tel:.
        </Text>
      </Stack>
    </Stack>
  )
}

import { icons } from "@sanity/icons"
import { Button, Card, Stack, Text, TextInput } from "@sanity/ui"
import { useToast } from "@sanity/ui/toast"
import { type FormEvent, useState } from "react"
import {
  type DocumentActionProps,
  useClient,
  useCurrentUser,
  useDocumentOperation,
} from "sanity"

import { resolvePresentationInitialUrl } from "../presentation/routing"

const API_VERSION = "2026-07-29"

type ImportResponse = {
  fields?: Record<string, unknown>
  missing?: string[]
  error?: string
}

export function importEndpoint(): string {
  return new URL(
    "/api/studio/event-import",
    resolvePresentationInitialUrl(),
  ).toString()
}

/**
 * Ask the website to read an event page with KI and fill this draft. The
 * signed-in editor creates a private, single-use request document; the site
 * only acts on such a request, so the endpoint needs no other credentials.
 */
export async function importFromUrl(
  client: ReturnType<typeof useClient>,
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<Required<Pick<ImportResponse, "fields" | "missing">>> {
  const requestId = crypto.randomUUID()
  await client.create({
    _id: `eventImportRequest.${requestId}`,
    _type: "eventImportRequest",
    url,
  })
  const response = await fetcher(importEndpoint(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requestId }),
  })
  const body = (await response.json().catch(() => ({}))) as ImportResponse
  if (!response.ok || !body.fields)
    throw new Error(body.error ?? "Importen feilet")
  return { fields: body.fields, missing: body.missing ?? [] }
}

export function ImportFromUrlAction(props: DocumentActionProps) {
  const client = useClient({ apiVersion: API_VERSION })
  const { patch } = useDocumentOperation(props.id, props.type)
  const currentUser = useCurrentUser()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [busy, setBusy] = useState(false)
  const source = (props.draft ?? props.published) as Record<
    string,
    unknown
  > | null
  // Trusted to administrators only for now; festivals and series are out of scope.
  if (!currentUser?.roles.some(role => role.name === "administrator"))
    return null
  if (source?.eventKind && source.eventKind !== "single") return null

  const close = () => {
    if (busy) return
    setOpen(false)
    props.onComplete()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await importFromUrl(client, url.trim())
      patch.execute([{ set: result.fields }])
      toast.push(
        result.missing.length
          ? {
              status: "warning",
              title: "Fylt ut. Noe mangler fortsatt",
              description: result.missing.join(" "),
              duration: 15000,
            }
          : { status: "success", title: "Arrangementet er fylt ut" },
      )
      setOpen(false)
      setUrl("")
      props.onComplete()
    } catch (error) {
      toast.push({
        status: "error",
        title: "Kunne ikke hente arrangementet",
        description: error instanceof Error ? error.message : "Ukjent feil",
      })
    } finally {
      setBusy(false)
    }
  }

  return {
    label: "Fyll ut fra lenke",
    icon: icons.link,
    onHandle: () => setOpen(true),
    dialog: open && {
      type: "dialog" as const,
      header: "Fyll ut fra lenke",
      onClose: close,
      content: (
        <form onSubmit={submit}>
          <Stack gap={4}>
            <Text size={1}>
              Lim inn lenken til arrangementet, for eksempel TicketCo, en annen
              billettside eller arrangørens nettside. Facebook krever innlogging
              og kan ikke leses. KI leser siden, finner rom i Crescat-bookingene
              og fyller ut feltene. Felter som blir funnet, overskriver det som
              står der fra før.
            </Text>
            <TextInput
              autoFocus
              disabled={busy}
              onChange={event => setUrl(event.currentTarget.value)}
              placeholder="https://ticketco.events/..."
              type="url"
              value={url}
            />
            {busy && (
              <Card padding={3} radius={2} tone="primary">
                <Text size={1}>KI leser siden. Dette kan ta et minutt …</Text>
              </Card>
            )}
            <Button
              disabled={busy || !/^https?:\/\/\S+$/.test(url.trim())}
              loading={busy}
              text="Hent og fyll ut"
              tone="primary"
              type="submit"
            />
          </Stack>
        </form>
      ),
    },
  }
}

import { createImageUrlBuilder } from "@sanity/image-url"
import { Badge, Button, Card, Flex, Stack, Text } from "@sanity/ui"
import { useState } from "react"
import { useClient } from "sanity"
import styled from "styled-components"
import { normalizeDocumentId } from "./arrangementFilters"
import {
  buildArrangementPreview,
  EMPTY_PREVIEW_REFERENCES,
  type PreviewDocument,
  type PreviewLocale,
  type PreviewReferences,
} from "./arrangementPreview"
import { useListeningQuery } from "./useListeningQuery"

const REFERENCE_QUERY = `{
 "room": *[_id == $roomId][0]{_id,localizedTitle,floor},
 "eventType": *[_id == $typeId][0]{_id,localizedName},
 "organizer": *[_id == $organizerId][0]{_id,localizedName},
 "parent": *[_id == $parentId][0],
 "childDates": *[_type == "arrangement" && parentEvent._ref == $documentId && approvalStatus == "approved"].dates[]
}`
const LISTEN_QUERY = `*[_id in [$roomId,"drafts."+$roomId,$typeId,"drafts."+$typeId,$organizerId,"drafts."+$organizerId,$parentId,"drafts."+$parentId] || parentEvent._ref == $documentId]`
const Layout = styled.div`
 display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr)); gap:1.5rem;
`
const CatalogueCard = styled.article`
 color:#181818; background:#fffdf6; padding:16px; border:1px solid #dedbd0;
 font-family:Arial,sans-serif;
 img {width:100%;aspect-ratio:16/9;object-fit:cover;display:block;}
 h3 {font-size:24px;line-height:1.12;margin:12px 0;font-weight:800;overflow-wrap:anywhere;}
 p {font-size:14px;line-height:1.5;margin:8px 0;}
 .image-placeholder {aspect-ratio:16/9;background:#ece9de;display:grid;place-items:center;color:#68645b;}
 .metadata {display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px;font-size:13px;}
 .tag {background:#efe548;padding:4px 8px;font-weight:600;}
 .status {background:#ffd9d9;padding:4px 8px;}
 .location {color:#57534b;}
`
const Meter = styled.progress`
 width:100%; height:12px; accent-color:#45944c;
`
const SourceLink = styled.a`
 color:inherit; text-underline-offset:3px; overflow-wrap:anywhere;
 &:focus-visible {outline:2px solid currentColor;outline-offset:3px;}
`
function safeLink(url: string | null | undefined) {
  try {
    const parsed = new URL(url ?? "")
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}
export function ArrangementReviewPreview({
  document,
}: {
  document: PreviewDocument
}) {
  const client = useClient({ apiVersion: "2026-07-29" })
  const [locale, setLocale] = useState<PreviewLocale>("nb")
  const { data: refs, loading } = useListeningQuery<PreviewReferences>({
    initialValue: EMPTY_PREVIEW_REFERENCES,
    query: REFERENCE_QUERY,
    listenQuery: LISTEN_QUERY,
    params: {
      roomId: document.room?._ref ?? "",
      typeId: document.eventType?._ref ?? "",
      organizerId: document.organizerGroup?._ref ?? "",
      parentId: document.parentEvent?._ref ?? "",
      documentId: normalizeDocumentId(document._id ?? ""),
    },
  })
  // Do not display references from the previous document while a new query loads.
  const currentRefs = loading ? EMPTY_PREVIEW_REFERENCES : refs
  const child = ["seriesInstance", "festivalSession"].includes(
    document.eventKind ?? "",
  )
  const parent = currentRefs.parent
  const inheritedType =
    child && !document.eventType ? parent?.eventType?._ref : null
  const inheritedOrganizer =
    child && !document.organizerGroup ? parent?.organizerGroup?._ref : null
  const { data: inheritedRefs, loading: inheritedLoading } =
    useListeningQuery<PreviewReferences>({
      enabled: Boolean(inheritedType || inheritedOrganizer),
      initialValue: EMPTY_PREVIEW_REFERENCES,
      query: REFERENCE_QUERY,
      listenQuery: LISTEN_QUERY,
      params: {
        roomId: "",
        typeId: inheritedType ?? "",
        organizerId: inheritedOrganizer ?? "",
        parentId: "",
        documentId: "",
      },
    })
  const preview = buildArrangementPreview(
    document,
    {
      ...currentRefs,
      eventType:
        currentRefs.eventType ??
        (!inheritedLoading ? inheritedRefs.eventType : null),
      organizer:
        currentRefs.organizer ??
        (!inheritedLoading ? inheritedRefs.organizer : null),
    },
    locale,
  )
  const image = preview.imageRef
    ? createImageUrlBuilder(client)
        .image({
          asset: { _ref: preview.imageRef },
          ...(document.image ?? (child ? parent?.image : null)),
        })
        .width(900)
        .height(506)
        .fit("crop")
        .auto("format")
        .url()
    : null
  const ticket = safeLink(preview.ticketUrl)
  const facebook = safeLink(preview.facebookUrl)
  const isSkonk = document.submittedBy === "E-tjenesten's Skonk"
  return (
    <Card border padding={4} radius={2}>
      <Stack gap={4}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack gap={2}>
            <Text weight="semibold" size={2}>
              Slik møter publikum arrangementet
            </Text>
            <Text muted size={1}>
              Forhåndsvisning av arrangementskortet
            </Text>
          </Stack>
          <Flex gap={2}>
            <Button
              text="Norsk"
              mode={locale === "nb" ? "default" : "ghost"}
              onClick={() => setLocale("nb")}
              aria-pressed={locale === "nb"}
            />
            <Button
              text="English"
              mode={locale === "en" ? "default" : "ghost"}
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
            />
          </Flex>
        </Flex>
        <Layout>
          <CatalogueCard aria-label="Forhåndsvisning av arrangement">
            {image ? (
              <img src={image} alt="" />
            ) : (
              <div className="image-placeholder">Bilde mangler</div>
            )}
            <div className="metadata">
              {preview.type ? (
                <span className="tag">{preview.type}</span>
              ) : null}
              {preview.dateLabels[0] ? (
                <span>{preview.dateLabels[0]}</span>
              ) : null}
              {preview.status ? (
                <span className="status">{preview.status}</span>
              ) : null}
            </div>
            <h3>{preview.title}</h3>
            <p className="location">
              {preview.room
                ? `⌖ ${preview.room}${preview.floor != null ? ` · ${preview.floor}. etasje` : ""}`
                : document.eventKind === "festivalParent"
                  ? "Festivalprogram"
                  : "⌖ Rom mangler"}
            </p>
            {preview.dateLabels.length > 1 ? (
              <p>{preview.dateLabels.slice(1).join(" · ")}</p>
            ) : null}
          </CatalogueCard>
          <Stack gap={3}>
            <Text weight="semibold">
              {preview.completed} av {preview.total} felt på plass{" "}
              {preview.completed === preview.total ? "✦" : ""}
            </Text>
            <Meter
              aria-label="Utfylte arrangementsfelt"
              value={preview.completed}
              max={preview.total}
            />
            <Text muted size={1}>
              Utfylte felt gir et godt utgangspunkt. Kontroller at innholdet
              faktisk stemmer før du godkjenner.
            </Text>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: 10,
              }}
            >
              {preview.checks.map(check => (
                <li key={check.id}>
                  <Text size={1}>
                    <span aria-hidden>{check.done ? "✓" : "○"} </span>
                    {check.label}
                    {!check.done && check.required
                      ? " — må fylles ut"
                      : !check.done
                        ? " — anbefalt"
                        : " — på plass"}
                  </Text>
                </li>
              ))}
            </ul>
            <Badge
              tone={preview.missingRequired.length ? "caution" : "positive"}
            >
              {preview.missingRequired.length
                ? `${preview.missingRequired.length} nødvendige felt mangler`
                : "Nødvendige felt er utfylt"}
            </Badge>
          </Stack>
        </Layout>
        <Card padding={3} radius={2} tone={isSkonk ? "caution" : "default"}>
          <Stack gap={3}>
            {isSkonk ? (
              <Text size={1} weight="semibold">
                Automatisk import — se nøye gjennom rom, dørtider, pris og
                artistnavn.
              </Text>
            ) : null}
            {document.submittedBy ? (
              <Text size={1}>
                Innsendt av {document.submittedBy}
                {document.submittedByEmail
                  ? ` · ${document.submittedByEmail}`
                  : ""}
              </Text>
            ) : null}
            <Text size={1}>Pris: {preview.pricing || "Mangler"}</Text>
            {preview.organizer ? (
              <Text size={1}>Arrangør: {preview.organizer}</Text>
            ) : null}
            <Flex gap={4} wrap="wrap">
              {ticket ? (
                <SourceLink
                  href={ticket}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Se billettkilden ↗
                </SourceLink>
              ) : (
                <Text muted size={1}>
                  Billettlenke ikke oppgitt
                </Text>
              )}
              {facebook ? (
                <SourceLink
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook-arrangement ↗
                </SourceLink>
              ) : null}
            </Flex>
            {preview.description ? (
              <details>
                <summary>
                  Les beskrivelsen ({locale === "nb" ? "norsk" : "English"})
                </summary>
                <p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {preview.description}
                </p>
              </details>
            ) : null}
          </Stack>
        </Card>
      </Stack>
    </Card>
  )
}

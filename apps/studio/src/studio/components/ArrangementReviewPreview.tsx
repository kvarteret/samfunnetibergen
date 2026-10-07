import { CropIcon } from "@sanity/icons/Crop"
import { EditIcon } from "@sanity/icons/Edit"
import { createImageUrlBuilder } from "@sanity/image-url"
import { Badge, Button, Card, Flex, Stack, Text } from "@sanity/ui"
import { useState } from "react"
import { type Path, useClient } from "sanity"
import styled from "styled-components"
import { normalizeDocumentId } from "./arrangementFilters"
import {
  buildArrangementPreview,
  EMPTY_PREVIEW_REFERENCES,
  type PreviewCheck,
  type PreviewDocument,
  type PreviewLocale,
  type PreviewReferences,
} from "./arrangementPreview"
import {
  cropFrame,
  croppedArea,
  type FrameSource,
  relativeFrame,
} from "./imageFrames"
import { useListeningQuery } from "./useListeningQuery"

const REFERENCE_QUERY = `{
 "room": *[_id == $roomId][0]{_id,localizedTitle,floor},
 "eventType": *[_id == $typeId][0]{_id,localizedName},
 "organizer": *[_id == $organizerId][0]{_id,localizedName},
 "parent": *[_id == $parentId][0],
 "childDates": *[_type == "arrangement" && parentEvent._ref == $documentId && approvalStatus == "approved"].dates[]
}`
const LISTEN_QUERY = `*[_id in [$roomId,"drafts."+$roomId,$typeId,"drafts."+$typeId,$organizerId,"drafts."+$organizerId,$parentId,"drafts."+$parentId] || parentEvent._ref == $documentId]`
// Infoskjermen viser 4:3; arrangementskortene på nettsiden viser 16:9.
const FRAMES = [
  { label: "4:3", ratio: 4 / 3, className: "frame primary" },
  { label: "16:9", ratio: 16 / 9, className: "frame card" },
]
const Layout = styled.div`
 display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr)); gap:1.5rem; align-items:start;
`
const CatalogueCard = styled.article`
 color:#181818; background:#fffdf6; padding:16px; border:1px solid #dedbd0;
 font-family:Arial,sans-serif;
 h3 {font-size:24px;line-height:1.12;margin:12px 0;font-weight:800;overflow-wrap:anywhere;}
 p {font-size:14px;line-height:1.5;margin:8px 0;}
 .metadata {display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px;font-size:13px;}
 .tag {background:#efe548;padding:4px 8px;font-weight:600;}
 .status {background:#ffd9d9;padding:4px 8px;}
 .location {color:#57534b;}
`
const CardImage = styled.div`
 aspect-ratio:16/9; background:#ece9de; display:grid; place-items:center; color:#68645b;
 img {width:100%;height:100%;object-fit:cover;display:block;}
`
const ImageTool = styled.div`
 position:relative; background:#000;
 img {width:100%;height:100%;display:block;}
 .frame {position:absolute; pointer-events:none;}
 .frame span {
   position:absolute; left:4px; top:4px; color:#000;
   font:700 11px/1.2 Arial,sans-serif; padding:2px 5px;
 }
 .primary {border:2px solid #fff; box-shadow:0 0 0 1px rgb(0 0 0 / 0.5);}
 .primary span {background:#fff;}
 .card {border:2px dashed #efe548;}
 .card span {background:#efe548; top:auto; bottom:4px;}
`
const FieldList = styled.ul`
 list-style:none; padding:0; margin:0; display:grid; gap:2px;
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

function checkTone(check: PreviewCheck) {
  if (check.done) return "default" as const
  return check.required ? ("critical" as const) : ("caution" as const)
}

function FieldRow({
  check,
  onEdit,
}: {
  check: PreviewCheck
  onEdit?: (path: Path) => void
}) {
  return (
    <li>
      <Card padding={2} radius={2} tone={checkTone(check)}>
        <Flex align="flex-start" gap={3}>
          <Text size={1} aria-hidden>
            {check.done ? "✓" : check.required ? "!" : "○"}
          </Text>
          <Stack flex={1} gap={2}>
            <Text size={1} weight="semibold">
              {check.label}
              {check.done
                ? ""
                : check.required
                  ? " — må fylles ut"
                  : " — anbefalt"}
            </Text>
            {check.values.map(value => (
              <Text
                key={value}
                muted
                size={1}
                style={{ overflowWrap: "anywhere" }}
              >
                {value}
              </Text>
            ))}
          </Stack>
          {onEdit ? (
            <Button
              aria-label={`Endre ${check.label.toLowerCase()}`}
              fontSize={1}
              icon={EditIcon}
              mode="bleed"
              onClick={() => onEdit([check.path])}
              padding={2}
              text="Endre"
            />
          ) : null}
        </Flex>
      </Card>
    </li>
  )
}

export function ArrangementReviewPreview({
  document,
  onEditField,
}: {
  document: PreviewDocument
  /** Moves form focus to a field; omitted where the form is not editable. */
  onEditField?: (path: Path) => void
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
  const ownImage = Boolean(document.image?.asset?._ref)
  const imageSource: FrameSource | null = preview.imageRef
    ? {
        ...((ownImage ? document.image : child ? parent?.image : null) ?? {}),
        asset: { _ref: preview.imageRef },
      }
    : null
  const builder = createImageUrlBuilder(client)
  const cardImage = imageSource
    ? builder
        .image(imageSource)
        .width(960)
        .height(540)
        .fit("crop")
        .auto("format")
        .url()
    : null
  const area = imageSource ? croppedArea(imageSource) : null
  const fullImage =
    imageSource && area
      ? builder.image(imageSource).width(960).auto("format").url()
      : null
  const frames =
    imageSource && area
      ? FRAMES.flatMap(frame => {
          const rect = cropFrame(imageSource, frame.ratio)
          return rect
            ? [{ ...frame, rect: relativeFrame(rect, area.rect) }]
            : []
        })
      : []
  const ticket = safeLink(preview.ticketUrl)
  const facebook = safeLink(preview.facebookUrl)
  const isSkonk = document.submittedBy === "E-tjenesten's Skonk"
  const missingRequired = preview.missingRequired.length
  return (
    <Card border padding={4} radius={2}>
      <Stack gap={4}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack gap={2}>
            <Text weight="semibold" size={2}>
              Kontroller arrangementet
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
        {isSkonk ? (
          <Card padding={3} radius={2} tone="caution">
            <Text size={1} weight="semibold">
              Automatisk import — se nøye gjennom rom, dørtider, pris og
              artistnavn.
            </Text>
          </Card>
        ) : null}
        <Layout>
          <Stack gap={3}>
            <CatalogueCard aria-label="Forhåndsvisning av arrangement">
              <CardImage>
                {cardImage ? <img src={cardImage} alt="" /> : "Bilde mangler"}
              </CardImage>
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
            </CatalogueCard>
            {fullImage && area ? (
              <Stack gap={2}>
                <ImageTool style={{ aspectRatio: area.aspectRatio }}>
                  <img src={fullImage} alt="" />
                  {frames.map(frame => (
                    <div
                      className={frame.className}
                      key={frame.label}
                      style={{
                        left: `${frame.rect.left * 100}%`,
                        top: `${frame.rect.top * 100}%`,
                        width: `${frame.rect.width * 100}%`,
                        height: `${frame.rect.height * 100}%`,
                      }}
                    >
                      <span>{frame.label}</span>
                    </div>
                  ))}
                </ImageTool>
                {onEditField && ownImage ? (
                  <Button
                    icon={CropIcon}
                    mode="ghost"
                    onClick={() => onEditField(["image", "hotspot"])}
                    text="Juster utsnitt og fokus"
                  />
                ) : null}
                {!ownImage ? (
                  <Text muted size={1}>
                    Arvet fra{" "}
                    {document.eventKind === "festivalSession"
                      ? "festivalen"
                      : "serien"}
                  </Text>
                ) : null}
              </Stack>
            ) : null}
          </Stack>
          <Stack gap={3}>
            <Flex align="center" gap={2} wrap="wrap">
              <Badge tone={missingRequired ? "critical" : "positive"}>
                {missingRequired ? `${missingRequired} må fylles ut` : "Klar"}
              </Badge>
            </Flex>
            <FieldList>
              {preview.checks.map(check => (
                <FieldRow check={check} key={check.id} onEdit={onEditField} />
              ))}
            </FieldList>
          </Stack>
        </Layout>
        <Card padding={3} radius={2} tone="transparent" border>
          <Stack gap={3}>
            {document.submittedBy ? (
              <Text size={1}>
                Innsendt av {document.submittedBy}
                {document.submittedByEmail
                  ? ` · ${document.submittedByEmail}`
                  : ""}
              </Text>
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
                  Les hele beskrivelsen ({locale === "nb" ? "norsk" : "English"}
                  )
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

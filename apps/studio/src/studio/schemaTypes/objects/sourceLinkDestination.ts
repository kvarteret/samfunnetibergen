export type SourceLinkValue = {
  linkType?: "internalPage" | "internalPath" | "external"
  internalPage?: { _type: "reference"; _ref: string }
  internalPath?: string
  externalUrl?: string
}

export type SourceLinkDestination =
  | { kind: "internalDocument"; documentId: string }
  | { kind: "internalPath"; href: string }
  | { kind: "external"; href: string }

export type SourceLinkPatch =
  | { type: "set"; path: string; value: unknown }
  | { type: "unset"; path: string }

const internalPathPattern = /^\/(?!\/)/
const externalUrlPattern = /^(https?:|mailto:|tel:)/i

export function parseDestinationInput(
  input: string,
): SourceLinkDestination | null {
  const value = input.trim()

  if (!value) {
    return null
  }

  if (internalPathPattern.test(value)) {
    return { kind: "internalPath", href: value }
  }

  if (externalUrlPattern.test(value)) {
    return { kind: "external", href: value }
  }

  return null
}

export function buildDestinationPatches(
  destination: SourceLinkDestination | null,
): SourceLinkPatch[] {
  if (!destination) {
    return ["linkType", "internalPage", "internalPath", "externalUrl"].map(
      path => ({ type: "unset" as const, path }),
    )
  }

  if (destination.kind === "internalDocument") {
    return [
      { type: "set", path: "linkType", value: "internalPage" },
      {
        type: "set",
        path: "internalPage",
        value: { _type: "reference", _ref: destination.documentId },
      },
      { type: "unset", path: "internalPath" },
      { type: "unset", path: "externalUrl" },
    ]
  }

  if (destination.kind === "internalPath") {
    return [
      { type: "set", path: "linkType", value: "internalPath" },
      { type: "set", path: "internalPath", value: destination.href },
      { type: "unset", path: "internalPage" },
      { type: "unset", path: "externalUrl" },
    ]
  }

  return [
    { type: "set", path: "linkType", value: "external" },
    { type: "set", path: "externalUrl", value: destination.href },
    { type: "unset", path: "internalPage" },
    { type: "unset", path: "internalPath" },
  ]
}

export function getDestinationValue(value: SourceLinkValue | undefined) {
  if (value?.linkType === "internalPage" && value.internalPage?._ref) {
    return `document:${value.internalPage._ref}`
  }
  if (value?.linkType === "internalPath") {
    return value.internalPath ?? ""
  }
  if (value?.linkType === "external") {
    return value.externalUrl ?? ""
  }
  return ""
}

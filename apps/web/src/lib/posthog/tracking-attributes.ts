type TrackableContent = {
  _id: string
  slug: string
}

export type TrackedContentType = "arrangement" | "room" | "group"

export type ContentPageViewProperties = {
  content_id: string
  content_slug: string
  content_title: string
  content_type: TrackedContentType
  locale: "nb" | "en"
}

export function contentPageViewProperties(
  content: TrackableContent & { title: string },
  contentType: TrackedContentType,
  locale: "nb" | "en",
): ContentPageViewProperties {
  return {
    content_id: content._id,
    content_slug: content.slug,
    content_title: content.title,
    content_type: contentType,
    locale,
  }
}

export function eventTrackingAttributes(
  event: TrackableContent,
  surface: string,
) {
  return {
    "data-event-id": event._id,
    "data-event-slug": event.slug,
    "data-event-surface": surface,
  } as const
}

export function groupTrackingAttributes(
  group: TrackableContent,
  surface: string,
) {
  return {
    "data-group-id": group._id,
    "data-group-slug": group.slug,
    "data-group-surface": surface,
  } as const
}

export function roomTrackingAttributes(
  room: TrackableContent,
  surface: string,
) {
  return {
    "data-room-id": room._id,
    "data-room-slug": room.slug,
    "data-room-surface": surface,
  } as const
}

type TrackableContent = {
  _id: string
  slug: string
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

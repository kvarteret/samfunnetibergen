const EVENT_IMAGE_MAX_SIZE_MB = 10;
export const EVENT_IMAGE_MAX_SIZE_BYTES = EVENT_IMAGE_MAX_SIZE_MB * 1024 * 1024;

export const EVENT_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function formatEventImageMaxSize(): string {
  return `${EVENT_IMAGE_MAX_SIZE_MB} MB`;
}

export function isAcceptedEventImageType(type: string): boolean {
  return EVENT_IMAGE_ACCEPTED_TYPES.includes(
    type as (typeof EVENT_IMAGE_ACCEPTED_TYPES)[number],
  );
}

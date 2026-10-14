export type GroupRecruitmentDocument = {
  slug?: { current?: string }
  applicationStatus?: string | null
}

/** Explicit recruitment preset; run only when resetting the current intake. */
export function buildGroupRecruitmentPatch(document: GroupRecruitmentDocument) {
  if (!document.slug?.current) {
    throw new Error("Group without a slug needs editorial review")
  }
  const applicationStatus =
    document.slug.current === "immaturus" ? "external" : "open"
  return document.applicationStatus === applicationStatus
    ? {}
    : { applicationStatus }
}

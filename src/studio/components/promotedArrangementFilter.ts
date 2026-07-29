export const PROMOTABLE_ARRANGEMENTS_FILTER = `
  approvalStatus == "approved" &&
  coalesce(eventKind, "single") in ["single", "seriesParent", "festivalParent"] &&
  select(
    coalesce(eventKind, "single") in ["seriesParent", "festivalParent"] =>
      count(*[
        _type == "arrangement" &&
        parentEvent._ref == string::split(^._id, "drafts.")[-1] &&
        approvalStatus == "approved" &&
        count(dates[startDate >= $today]) > 0
      ]) > 0,
    count(dates[startDate >= $today]) > 0
  )
`

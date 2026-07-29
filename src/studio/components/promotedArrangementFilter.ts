export const PROMOTED_ARRANGEMENTS_FILTER = `
  isPromoted == true &&
  approvalStatus == "approved" &&
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

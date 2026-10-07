export type ScheduledFeature = {
  /** Last day the arrangement is on the programme (YYYY-MM-DD). */
  lastDate?: string | null
}

export type FeatureWindow = {
  /** First day the arrangement is shown, or null if it never gets a slot. */
  from: string | null
  /** Last day the arrangement is shown. */
  until: string | null
}

function nextDay(date: string): string {
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return next.toISOString().slice(0, 10)
}

/**
 * Predicts when each selected arrangement occupies one of the front-page
 * slots. The website shows the first `visibleCount` selected arrangements
 * that have not ended yet, in selection order, so queued arrangements move up
 * as earlier ones finish.
 */
export function featuredSchedule(
  selection: ScheduledFeature[],
  visibleCount: number,
  today: string,
): FeatureWindow[] {
  const days = [
    today,
    ...selection.flatMap(item =>
      item.lastDate && item.lastDate >= today ? [nextDay(item.lastDate)] : [],
    ),
  ]
  const changeDays = [...new Set(days)].sort()
  const windows: FeatureWindow[] = selection.map(() => ({
    from: null,
    until: null,
  }))
  for (const day of changeDays) {
    const shown = selection
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.lastDate || item.lastDate >= day)
      .slice(0, visibleCount)
    for (const { item, index } of shown) {
      const window = windows[index]
      if (!window || window.from) continue
      window.from = day
      window.until = item.lastDate ?? null
    }
  }
  return windows
}

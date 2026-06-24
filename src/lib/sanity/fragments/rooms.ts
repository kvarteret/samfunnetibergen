const durationProjection = `{
    start,
    end
}`

export const openingHoursProjection = `{
    rows[] {
        _key,
        weekdays,
        "status": coalesce(status, select(closed == true => "closed", "open")),
        note,
        "duration": duration ${durationProjection}
    }
}`

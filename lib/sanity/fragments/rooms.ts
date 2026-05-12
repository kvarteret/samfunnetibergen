const durationProjection = `{
    start,
    end
}`

export const openingHoursProjection = `{
    rows[] {
        _key,
        label,
        "status": coalesce(status, select(closed == true => "closed", "open")),
        note,
        "duration": duration ${durationProjection}
    }
}`

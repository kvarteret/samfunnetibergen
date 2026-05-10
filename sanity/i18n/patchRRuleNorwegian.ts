import { RRule } from "rrule"

const NB_LANGUAGE = {
    dayNames: ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"],
    monthNames: [
        "januar",
        "februar",
        "mars",
        "april",
        "mai",
        "juni",
        "juli",
        "august",
        "september",
        "oktober",
        "november",
        "desember",
    ],
    tokens: {},
}

const NB_STRINGS: Record<string, string> = {
    every: "hver",
    hour: "time",
    hours: "timer",
    minute: "minutt",
    minutes: "minutter",
    day: "dag",
    days: "dager",
    weekday: "ukedag",
    weekdays: "ukedager",
    week: "uke",
    weeks: "uker",
    month: "måned",
    months: "måneder",
    year: "år",
    years: "år",
    on: "på",
    in: "i",
    the: "den",
    for: "i",
    time: "gang",
    times: "ganger",
    until: "til",
    last: "siste",
    and: "og",
    or: "eller",
    "(~ approximate)": "(~ tilnærmet)",
    st: ".",
    nd: ".",
    rd: ".",
    th: ".",
}

const nbGettext = (id: string | number | { toString(): string }) =>
    NB_STRINGS[id.toString()] ?? id.toString()

const nbDateFormatter = (year: number, month: string, day: number) =>
    `${day}. ${month} ${year}`

const originalToText = RRule.prototype.toText

RRule.prototype.toText = function (gettext, language, dateFormatter) {
    return originalToText.call(
        this,
        gettext ?? nbGettext,
        language ?? NB_LANGUAGE,
        dateFormatter ?? nbDateFormatter,
    )
}

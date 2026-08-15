import { portableTextProjection } from "./portableText"
export const editorialSectionProjection = `{
    _key,
    _type,
    "title": coalesce(localizedTitle[language == $locale && defined(value) && value != ""][0].value, localizedTitle[language == "nb" && defined(value) && value != ""][0].value),
    "body": coalesce(coalesce(localizedBody[language == $locale && defined(value) && value != ""][0].value, localizedBody[language == "nb" && defined(value) && value != ""][0].value, [])[] ${portableTextProjection}, [])
}`

export const infoAddressBlockProjection = `{
    _key,
    _type,
    "heading": coalesce(localizedHeading[language == $locale && defined(value) && value != ""][0].value, localizedHeading[language == "nb" && defined(value) && value != ""][0].value),
    "body": coalesce(coalesce(localizedBody[language == $locale && defined(value) && value != ""][0].value, localizedBody[language == "nb" && defined(value) && value != ""][0].value, [])[] ${portableTextProjection}, []),
    "address": coalesce(localizedAddress[language == $locale && defined(value) && value != ""][0].value, localizedAddress[language == "nb" && defined(value) && value != ""][0].value),
    mapUrl
}`

export const infoAccordionBlockProjection = `{
    _key,
    _type,
    "heading": coalesce(localizedHeading[language == $locale && defined(value) && value != ""][0].value, localizedHeading[language == "nb" && defined(value) && value != ""][0].value),
    "intro": coalesce(localizedIntro[language == $locale && defined(value) && value != ""][0].value, localizedIntro[language == "nb" && defined(value) && value != ""][0].value),
    "items": coalesce(items[] {
        _key,
        "title": coalesce(localizedTitle[language == $locale && defined(value) && value != ""][0].value, localizedTitle[language == "nb" && defined(value) && value != ""][0].value),
        "body": coalesce(coalesce(localizedBody[language == $locale && defined(value) && value != ""][0].value, localizedBody[language == "nb" && defined(value) && value != ""][0].value, [])[] ${portableTextProjection}, [])
    }, [])
}`

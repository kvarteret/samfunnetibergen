import { portableTextProjection } from "./portableText"

export const editorialSectionProjection = `{
    _key,
    _type,
    title,
    "body": coalesce(body[] ${portableTextProjection}, [])
}`

export const localizedEditorialSectionProjection = `{
    _key,
    _type,
    "title": coalesce(localizedTitle[language == $locale][0].value, localizedTitle[language == "nb"][0].value, title),
    "body": coalesce(localizedBody[language == $locale][0].value, localizedBody[language == "nb"][0].value, body[] ${portableTextProjection}, [])
}`

export const infoAddressBlockProjection = `{
    _key,
    _type,
    "heading": coalesce(localizedHeading[language == $locale][0].value, localizedHeading[language == "nb"][0].value, heading),
    "body": coalesce(localizedBody[language == $locale][0].value, localizedBody[language == "nb"][0].value, body[] ${portableTextProjection}, []),
    address,
    mapUrl
}`

export const infoAccordionBlockProjection = `{
    _key,
    _type,
    "heading": coalesce(localizedHeading[language == $locale][0].value, localizedHeading[language == "nb"][0].value, heading),
    "intro": coalesce(localizedIntro[language == $locale][0].value, localizedIntro[language == "nb"][0].value, intro),
    "items": coalesce(items[] {
        _key,
        "title": coalesce(localizedTitle[language == $locale][0].value, localizedTitle[language == "nb"][0].value, title),
        "body": coalesce(localizedBody[language == $locale][0].value, localizedBody[language == "nb"][0].value, body[] ${portableTextProjection}, [])
    }, [])
}`

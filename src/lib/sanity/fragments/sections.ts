import { sourceLinkProjection } from "./links"
import { portableTextProjection } from "./portableText"

export const editorialSectionProjection = `{
    _key,
    _type,
    title,
    "paragraphs": coalesce(paragraphs, []),
    "links": coalesce(links[] ${sourceLinkProjection}, [])
}`

export const infoAddressBlockProjection = `{
    _key,
    _type,
    heading,
    "body": coalesce(body[] ${portableTextProjection}, []),
    address,
    mapUrl
}`

export const infoAccordionBlockProjection = `{
    _key,
    _type,
    heading,
    intro,
    "items": coalesce(items[] {
        _key,
        title,
        "body": coalesce(body[] ${portableTextProjection}, [])
    }, [])
}`

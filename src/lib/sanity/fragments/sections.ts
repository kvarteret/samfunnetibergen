import { sourceLinkProjection } from "./links"

export const editorialSectionProjection = `{
    _key,
    title,
    "paragraphs": coalesce(paragraphs, []),
    "links": coalesce(links[] ${sourceLinkProjection}, [])
}`

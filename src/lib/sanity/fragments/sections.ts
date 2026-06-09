import { sourceLinkProjection } from "./links";

export const editorialSectionProjection = `{
    _key,
    title,
    paragraphs,
    links[] ${sourceLinkProjection}
}`;

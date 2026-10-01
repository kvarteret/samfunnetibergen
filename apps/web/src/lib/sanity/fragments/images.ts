// `id` (`image-<hash>-<w>x<h>-<fmt>`) is what `sanity-image` needs to build CDN
// URLs and `srcSet`s; `hotspot`/`crop` let it honour the focal point editors set
// in the Studio, and `lqip` gives it a blur preview.
export const sourcedImageProjection = `{
    _key,
    "id": image.asset._ref,
    "hotspot": image.hotspot,
    "crop": image.crop,
    "lqip": image.asset->metadata.lqip,
    "alt": coalesce(localizedAlt[language == $locale && defined(value) && value != ""][0].value, localizedAlt[language == "nb" && defined(value) && value != ""][0].value),
    "caption": coalesce(localizedCaption[language == $locale && defined(value) && value != ""][0].value, localizedCaption[language == "nb" && defined(value) && value != ""][0].value)
}`

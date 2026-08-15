export const sourcedImageProjection = `{
    _key,
    "assetUrl": image.asset->url,
    "alt": coalesce(localizedAlt[language == $locale && defined(value) && value != ""][0].value, localizedAlt[language == "nb" && defined(value) && value != ""][0].value),
    "caption": coalesce(localizedCaption[language == $locale && defined(value) && value != ""][0].value, localizedCaption[language == "nb" && defined(value) && value != ""][0].value)
}`

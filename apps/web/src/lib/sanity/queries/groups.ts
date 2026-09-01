import { defineQuery } from "next-sanity"

import { sourcedImageProjection } from "../fragments/images"

const groupName = `coalesce(localizedName[language == $locale && defined(value) && value != ""][0].value, localizedName[language == "nb" && defined(value) && value != ""][0].value, "[Mangler gruppenavn]")`
const groupSummary = `coalesce(localizedSummary[language == $locale && defined(value) && value != ""][0].value, localizedSummary[language == "nb" && defined(value) && value != ""][0].value, "[Mangler kort beskrivelse]")`
const groupBody = `coalesce(localizedBody[language == $locale && defined(value) && value != ""][0].value, localizedBody[language == "nb" && defined(value) && value != ""][0].value, [])`
const groupLabels = `coalesce(string::split(localizedLabels[language == $locale && defined(value) && value != ""][0].value, "\\n"), string::split(localizedLabels[language == "nb" && defined(value) && value != ""][0].value, "\\n"), [])`

export const studentGroupsQuery =
  defineQuery(`*[_type == "studentGroup" && !defined(parentGroup)] | order(orderRank asc) {
    _id,
    "name": ${groupName},
    "slug": coalesce(slug.current, ""),
    "summary": ${groupSummary},
    email,
    website,
    "links": coalesce(links[] {
      platform,
      url,
      "customLabel": coalesce(localizedCustomLabel[language == $locale && defined(value) && value != ""][0].value, localizedCustomLabel[language == "nb" && defined(value) && value != ""][0].value, customLabel)
    }, []),
    "category": coalesce(category, "arbeidsgruppe"),
    "labels": ${groupLabels},
    "logoUrl": logo.asset->url,
    "image": image ${sourcedImageProjection},
    "subGroups": coalesce(*[_type == "studentGroup" && parentGroup._ref == ^._id] | order(orderRank asc, ${groupName} asc) {
        "name": ${groupName},
        "slug": coalesce(slug.current, "")
    }, [])
}`)

export const studentGroupSlugsQuery =
  defineQuery(`*[_type == "studentGroup" && defined(slug.current)] {
    "slug": slug.current
}`)

export const studentGroupBySlugQuery =
  defineQuery(`*[_type == "studentGroup" && slug.current == $slug][0] {
    _id,
    "name": ${groupName},
    "slug": coalesce(slug.current, ""),
    "summary": ${groupSummary},
    "body": ${groupBody},
    email,
    website,
    "links": coalesce(links[] {
      platform,
      url,
      "customLabel": coalesce(localizedCustomLabel[language == $locale && defined(value) && value != ""][0].value, localizedCustomLabel[language == "nb" && defined(value) && value != ""][0].value, customLabel)
    }, []),
    "category": coalesce(category, "arbeidsgruppe"),
    "logoUrl": logo.asset->url,
    "parentGroup": parentGroup-> {
        "name": ${groupName},
        "slug": coalesce(slug.current, "")
    },
    "subGroups": coalesce(*[_type == "studentGroup" && parentGroup._ref == ^._id] | order(orderRank asc, ${groupName} asc) {
        "name": ${groupName},
        "slug": coalesce(slug.current, ""),
        "summary": ${groupSummary},
        "category": coalesce(category, "arbeidsgruppe"),
        "image": image ${sourcedImageProjection}
    }, []),
    "image": image ${sourcedImageProjection}
}`)

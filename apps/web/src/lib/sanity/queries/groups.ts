import { defineQuery } from "next-sanity"

import { sourcedImageProjection } from "../fragments/images"

export const studentGroupsQuery =
  defineQuery(`*[_type == "studentGroup" && !defined(parentGroup)] | order(orderRank asc) {
    "name": coalesce(localizedName[language == $locale][0].value, localizedName[language == "nb"][0].value, name, "[Mangler gruppenavn]"),
    "slug": coalesce(slug.current, ""),
    "summary": coalesce(localizedSummary[language == $locale][0].value, localizedSummary[language == "nb"][0].value, summary, "[Mangler kort beskrivelse]"),
    email,
    website,
    "links": coalesce(links[] {
      platform,
      url,
      customLabel
    }, []),
    "category": coalesce(category, "arbeidsgruppe"),
    "labels": coalesce(labels, []),
    "logoUrl": logo.asset->url,
    "image": image ${sourcedImageProjection},
    "subGroups": coalesce(*[_type == "studentGroup" && parentGroup._ref == ^._id] | order(orderRank asc, name asc) {
        "name": coalesce(localizedName[language == $locale][0].value, localizedName[language == "nb"][0].value, name, "[Mangler gruppenavn]"),
        "slug": coalesce(slug.current, "")
    }, [])
}`)

export const studentGroupSlugsQuery =
  defineQuery(`*[_type == "studentGroup" && defined(slug.current)] {
    "slug": slug.current
}`)

export const studentGroupBySlugQuery =
  defineQuery(`*[_type == "studentGroup" && slug.current == $slug][0] {
    "name": coalesce(localizedName[language == $locale][0].value, localizedName[language == "nb"][0].value, name, "[Mangler gruppenavn]"),
    "slug": coalesce(slug.current, ""),
    "summary": coalesce(localizedSummary[language == $locale][0].value, localizedSummary[language == "nb"][0].value, summary, "[Mangler kort beskrivelse]"),
    "body": coalesce(localizedBody[language == $locale][0].value, localizedBody[language == "nb"][0].value, body, []),
    email,
    website,
    "links": coalesce(links[] {
      platform,
      url,
      customLabel
    }, []),
    "category": coalesce(category, "arbeidsgruppe"),
    "logoUrl": logo.asset->url,
    "parentGroup": parentGroup-> {
        "name": coalesce(localizedName[language == $locale][0].value, localizedName[language == "nb"][0].value, name, "[Mangler gruppenavn]"),
        "slug": coalesce(slug.current, "")
    },
    "subGroups": coalesce(*[_type == "studentGroup" && parentGroup._ref == ^._id] | order(orderRank asc, name asc) {
        "name": coalesce(localizedName[language == $locale][0].value, localizedName[language == "nb"][0].value, name, "[Mangler gruppenavn]"),
        "slug": coalesce(slug.current, ""),
        "summary": coalesce(localizedSummary[language == $locale][0].value, localizedSummary[language == "nb"][0].value, summary, "[Mangler kort beskrivelse]"),
        "category": coalesce(category, "arbeidsgruppe"),
        "image": image ${sourcedImageProjection}
    }, []),
    "image": image ${sourcedImageProjection}
}`)

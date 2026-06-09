import { defineQuery } from "next-sanity";

import { sourcedImageProjection } from "../fragments/images";

export const studentGroupsQuery =
  defineQuery(`*[_type == "studentGroup" && !defined(parentGroup)] | order(orderRank asc) {
    name,
    "slug": slug.current,
    summary,
    email,
    website,
    category,
    labels,
    "logoUrl": logo.asset->url,
    "image": image ${sourcedImageProjection},
    "subGroups": *[_type == "studentGroup" && parentGroup._ref == ^._id] | order(orderRank asc, name asc) {
        name,
        "slug": slug.current
    }
}`);

export const studentGroupSlugsQuery =
  defineQuery(`*[_type == "studentGroup" && defined(slug.current) && !defined(parentGroup)] {
    "slug": slug.current
}`);

export const allStudentGroupSlugsQuery =
  defineQuery(`*[_type == "studentGroup" && defined(slug.current)] {
    "slug": slug.current
}`);

export const studentGroupBySlugQuery =
  defineQuery(`*[_type == "studentGroup" && slug.current == $slug && !defined(parentGroup)][0] {
    name,
    "slug": slug.current,
    summary,
    body,
    email,
    website,
    category,
    "logoUrl": logo.asset->url,
    "parentGroup": parentGroup-> {
        name,
        "slug": slug.current
    },
    "subGroups": *[_type == "studentGroup" && parentGroup._ref == ^._id] | order(orderRank asc, name asc) {
        name,
        "slug": slug.current,
        summary,
        category,
        "image": image ${sourcedImageProjection}
    },
    "image": image ${sourcedImageProjection}
}`);

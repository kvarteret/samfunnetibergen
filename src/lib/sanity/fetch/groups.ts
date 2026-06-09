import "server-only";

import type { ClientReturn } from "@sanity/client";
import { stegaClean } from "@sanity/client/stega";
import { sanityClient } from "../client";
import { sanityFetch } from "../fetcher";
import {
  groupsPageQuery,
  studentGroupBySlugQuery,
  studentGroupSlugsQuery,
  studentGroupsQuery,
} from "../queries";
import { compact, type FetchOptions, withRequiredKeys } from "./shared";

export type GroupsPageContent = NonNullable<
  ClientReturn<typeof groupsPageQuery>
>;

export type StudentGroupSummary = ClientReturn<
  typeof studentGroupsQuery
>[number];

export type StudentGroupDetail = NonNullable<
  ClientReturn<typeof studentGroupBySlugQuery>
>;

export async function fetchGroupsPageContent(
  options: FetchOptions = {},
): Promise<GroupsPageContent | null> {
  const { data } = await sanityFetch({
    query: groupsPageQuery,
    tags: ["groupsPage"],
    stega: options.stega,
  });
  return data;
}

export async function fetchStudentGroups(): Promise<StudentGroupSummary[]> {
  const { data: groups } = await sanityFetch({
    query: studentGroupsQuery,
    tags: ["studentGroups"],
  });
  return withRequiredKeys(groups, "slug").map((group) => ({
    ...group,
    slug: stegaClean(group.slug),
  }));
}

export async function fetchStudentGroupSlugs(): Promise<string[]> {
  const groups = await sanityClient.fetch(
    studentGroupSlugsQuery,
    {},
    { next: { revalidate: 300, tags: ["studentGroups"] } },
  );
  return compact(groups.map((group) => group.slug));
}

export async function fetchStudentGroupBySlug(
  slug: string,
  options: FetchOptions = {},
): Promise<StudentGroupDetail | null> {
  const { data } = await sanityFetch({
    query: studentGroupBySlugQuery,
    params: { slug },
    tags: ["studentGroups"],
    stega: options.stega,
  });
  return data;
}

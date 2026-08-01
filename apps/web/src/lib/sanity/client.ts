import { createClient } from "next-sanity"

import { apiVersion, dataset, projectId } from "@/lib/sanity/env"

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
  stega: {
    studioUrl: "/studio",
  },
})

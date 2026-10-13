// Public Sanity identifiers. Environment variables only select another
// dataset (for example `development`); empty values fall back to production.
export const apiVersion = "2024-01-01"
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production"
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "mkjoahvv"

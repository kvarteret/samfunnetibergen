// Personal's public origin. PERSONAL_APP_BASE_URL overrides it for local or
// preview backends; production uses this committed default.
const PERSONAL_APP_ORIGIN = "https://personal.samfunnetibergen.no"

export function personalAppBaseUrl(): string {
  return (
    process.env.PERSONAL_APP_BASE_URL?.trim() || PERSONAL_APP_ORIGIN
  ).replace(/\/+$/, "")
}

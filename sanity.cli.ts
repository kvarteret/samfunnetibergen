import { defineCliConfig } from "sanity/cli"

import { dataset, projectId } from "./lib/sanity/env"

export default defineCliConfig({
    api: {
        projectId,
        dataset,
    },
    project: {
        basePath: "/studio",
    },
    server: {
        port: 3333,
    },
    schemaExtraction: {
        enabled: true,
        path: ".sanity/schema.json",
    },
})

import { defineCliConfig } from "sanity/cli"

import { dataset, projectId } from "./sanity/env"

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
})

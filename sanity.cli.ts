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
    schemaExtraction: {
        enabled: true,
        path: ".sanity/schema.json",
    },
    typegen: {
        enabled: true,
        path: [
            "./app/**/*.{ts,tsx,js,jsx}",
            "./components/**/*.{ts,tsx,js,jsx}",
            "./lib/**/*.{ts,tsx,js,jsx}",
            "./sanity/**/*.{ts,tsx,js,jsx}",
            "./*.{ts,tsx,js,jsx}",
        ],
        schema: ".sanity/schema.json",
        generates: "./sanity.types.ts",
        overloadClientMethods: true,
    },
})

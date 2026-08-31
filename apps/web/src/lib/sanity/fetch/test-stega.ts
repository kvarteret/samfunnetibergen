import {
  type ContentSourceMap,
  stegaEncodeSourceMap,
} from "@sanity/client/stega"

const TEST_SOURCE_MAP: ContentSourceMap = {
  documents: [{ _id: "test-document", _type: "test" }],
  paths: ["$['value']"],
  mappings: {
    "$['value']": {
      type: "value",
      source: { type: "documentValue", document: 0, path: 0 },
    },
  },
}

export function encodeStegaForTest(value: string): string {
  return stegaEncodeSourceMap({ value }, TEST_SOURCE_MAP, {
    enabled: true,
    studioUrl: "https://studio.samfunnetibergen.no",
    filter: () => true,
  }).value
}

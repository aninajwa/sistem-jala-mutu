import { defineConfig, InputTransformerFn } from "orval";
import path from "path";

const apiZodSrc = path.resolve(__dirname, "src", "lib", "api-zod");

// Output di-generate dengan asumsi judul API = "Api" (file api.ts).
const titleTransformer: InputTransformerFn = (config) => {
  config.info ??= {};
  config.info.title = "Api";
  return config;
};

export default defineConfig({
  zod: {
    input: { target: "./openapi.yaml", override: { transformer: titleTransformer } },
    output: {
      workspace: apiZodSrc,
      client: "zod",
      target: "generated",
      schemas: { path: "generated/types", type: "typescript" },
      mode: "split",
      clean: true,
      prettier: true,
      override: {
        zod: {
          version: 3,
          coerce: {
            query: ["boolean", "number", "string"],
            param: ["boolean", "number", "string"],
            body: ["bigint", "date"],
            response: ["bigint", "date"],
          },
        },
        useDates: true,
        useBigInt: true,
      },
    },
  },
});

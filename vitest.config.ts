import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@appops/schemas": resolve(__dirname, "packages/schemas"),
      "@appops/core": resolve(__dirname, "packages/core"),
    },
  },
})

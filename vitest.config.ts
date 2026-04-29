import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@core": resolve(__dirname, "packages/core"),
      "@schemas": resolve(__dirname, "packages/schemas"),
    },
  },
})

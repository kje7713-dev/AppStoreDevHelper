import { mkdtempSync, readFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { afterEach, describe, expect, it } from "vitest"
import { createApiKeyStore, maskApiKey } from "@web/lib/api-key-store"

const tempDirs: string[] = []

function makeStore() {
  const dataDir = mkdtempSync(join(tmpdir(), "api-key-store-test-"))
  tempDirs.push(dataDir)
  return { store: createApiKeyStore(dataDir), dataDir }
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (dir) rmSync(dir, { recursive: true, force: true })
  }
})

describe("api-key-store", () => {
  it("creates key, stores only hash, and validates raw key", () => {
    const { store, dataDir } = makeStore()
    const { key, rawKey } = store.createApiKey("local-agent")

    expect(rawKey).toMatch(/^appops_/)
    expect(key.keyPreview).toBe(maskApiKey(rawKey))
    expect(store.validateApiKey(rawKey)?.id).toBe(key.id)

    const fileContents = readFileSync(join(dataDir, "api-keys.json"), "utf-8")
    expect(fileContents).toContain("\"keyHash\"")
    expect(fileContents).toContain("\"keyPreview\"")
    expect(fileContents).not.toContain(rawKey)
  })

  it("revokes keys and blocks revoked key validation", () => {
    const { store } = makeStore()
    const { key, rawKey } = store.createApiKey("ci-script")

    expect(store.hasActiveApiKeys()).toBe(true)
    expect(store.revokeApiKey(key.id)).toBe(true)
    expect(store.validateApiKey(rawKey)).toBeUndefined()
    expect(store.hasActiveApiKeys()).toBe(false)
    expect(store.revokeApiKey("missing-id")).toBe(false)
  })
})

import { describe, it, expect, beforeEach } from "vitest"
import { mkdirSync, existsSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { createAppStore } from "@web/lib/app-store"
import type { AppProfile } from "@web/lib/types"

function makeTempDir(): string {
  const dir = join(tmpdir(), `app-store-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function makeApp(overrides: Partial<AppProfile> = {}): AppProfile {
  const now = new Date().toISOString()
  return {
    id: "test-id-1",
    name: "Test App",
    platform: "ios",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe("createAppStore", () => {
  let dataDir: string
  let store: ReturnType<typeof createAppStore>

  beforeEach(() => {
    dataDir = makeTempDir()
    store = createAppStore(dataDir)
  })

  it("listApps returns an empty array when no data file exists", () => {
    expect(store.listApps()).toEqual([])
  })

  it("saveApp persists an app that can be retrieved with getApp", () => {
    const app = makeApp()
    store.saveApp(app)
    expect(store.getApp(app.id)).toEqual(app)
  })

  it("listApps returns all saved apps", () => {
    const app1 = makeApp({ id: "id-1", name: "App One" })
    const app2 = makeApp({ id: "id-2", name: "App Two" })
    store.saveApp(app1)
    store.saveApp(app2)
    const list = store.listApps()
    expect(list).toHaveLength(2)
    expect(list.find((a) => a.id === "id-1")).toBeDefined()
    expect(list.find((a) => a.id === "id-2")).toBeDefined()
  })

  it("saveApp is idempotent - saving the same ID twice replaces the record", () => {
    const app = makeApp()
    store.saveApp(app)
    const updated = { ...app, name: "Updated Name" }
    store.saveApp(updated)
    expect(store.listApps()).toHaveLength(1)
    expect(store.getApp(app.id)?.name).toBe("Updated Name")
  })

  it("getApp returns undefined for an unknown ID", () => {
    expect(store.getApp("does-not-exist")).toBeUndefined()
  })

  it("updateApp applies a patch and updates the updatedAt timestamp", () => {
    const app = makeApp({ updatedAt: "2020-01-01T00:00:00.000Z" })
    store.saveApp(app)
    const result = store.updateApp(app.id, { name: "Patched Name", category: "Games" })
    expect(result).toBeDefined()
    expect(result?.name).toBe("Patched Name")
    expect(result?.category).toBe("Games")
    expect(result?.id).toBe(app.id)
    expect(result?.createdAt).toBe(app.createdAt)
    expect(result?.updatedAt).not.toBe("2020-01-01T00:00:00.000Z")
  })

  it("updateApp returns undefined for a non-existent app", () => {
    expect(store.updateApp("missing-id", { name: "X" })).toBeUndefined()
  })

  it("updateApp persists the change so subsequent reads reflect it", () => {
    const app = makeApp()
    store.saveApp(app)
    store.updateApp(app.id, { category: "Productivity" })
    expect(store.getApp(app.id)?.category).toBe("Productivity")
  })

  it("deleteApp removes the app and returns true", () => {
    const app = makeApp()
    store.saveApp(app)
    expect(store.deleteApp(app.id)).toBe(true)
    expect(store.getApp(app.id)).toBeUndefined()
    expect(store.listApps()).toHaveLength(0)
  })

  it("deleteApp returns false for a non-existent app", () => {
    expect(store.deleteApp("ghost-id")).toBe(false)
  })

  it("persists data across separate store instances using the same directory", () => {
    const app = makeApp({ id: "persist-id", name: "Persistent App" })
    store.saveApp(app)

    // Create a new store pointing at the same directory
    const store2 = createAppStore(dataDir)
    expect(store2.getApp("persist-id")?.name).toBe("Persistent App")
  })

  it("creates the data directory if it does not exist", () => {
    const nestedDir = join(dataDir, "nested", "path")
    const freshStore = createAppStore(nestedDir)
    freshStore.saveApp(makeApp())
    expect(existsSync(nestedDir)).toBe(true)
    expect(freshStore.listApps()).toHaveLength(1)
  })

  it("skips and warns on invalid records in the JSON file, returning only valid ones", () => {
    const app = makeApp({ id: "valid-id" })
    store.saveApp(app)

    // Manually corrupt the file by injecting a bad record
    const appsFile = join(dataDir, "apps.json")
    const valid = store.listApps()
    const corrupted = [...valid, { id: 123, notAValidApp: true }]
    writeFileSync(appsFile, JSON.stringify(corrupted, null, 2), "utf-8")

    const result = store.listApps()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("valid-id")
  })
})

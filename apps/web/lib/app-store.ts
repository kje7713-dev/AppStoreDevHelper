import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { z } from "zod"
import type { AppProfile } from "./types"

// File-based JSON storage for app profiles.
// Data lives at <project-root>/.data/apps.json.
// NOTE: This is a simple local store for the MVP. Replace with a database for production.

// Lightweight schema to validate persisted app records on read.
const StoredAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  platform: z.literal("ios"),
  bundleId: z.string().optional(),
  appStoreUrl: z.string().optional(),
  category: z.string().optional(),
  targetAudience: z.string().optional(),
  businessModel: z.enum(["free", "paid", "subscription", "iap", "freemium"]).optional(),
  currentMetadata: z
    .object({
      subtitle: z.string().optional(),
      promotionalText: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional(),
      releaseNotes: z.string().optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

/**
 * Creates an app store backed by a JSON file in the given directory.
 * Pass a custom directory (e.g. a temporary path) in tests.
 */
export function createAppStore(dataDir: string) {
  const appsFile = join(dataDir, "apps.json")

  function ensureDir(): void {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  function readApps(): AppProfile[] {
    try {
      if (!existsSync(appsFile)) return []
      const raw = readFileSync(appsFile, "utf-8")
      const parsed: unknown[] = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      const results = parsed.map((item) => StoredAppSchema.safeParse(item))
      results.forEach((r) => {
        if (!r.success) {
          console.warn("[app-store] Skipping invalid app record:", r.error.flatten())
        }
      })
      return results.filter((r) => r.success).map((r) => r.data as AppProfile)
    } catch {
      return []
    }
  }

  function writeApps(apps: AppProfile[]): void {
    ensureDir()
    writeFileSync(appsFile, JSON.stringify(apps, null, 2), "utf-8")
  }

  function listApps(): AppProfile[] {
    return readApps()
  }

  function getApp(id: string): AppProfile | undefined {
    return readApps().find((a) => a.id === id)
  }

  function saveApp(app: AppProfile): void {
    const apps = readApps()
    const idx = apps.findIndex((a) => a.id === app.id)
    if (idx >= 0) {
      apps[idx] = app
    } else {
      apps.push(app)
    }
    writeApps(apps)
  }

  function updateApp(id: string, patch: Partial<Omit<AppProfile, "id" | "createdAt">>): AppProfile | undefined {
    const apps = readApps()
    const idx = apps.findIndex((a) => a.id === id)
    if (idx < 0) return undefined
    const updated: AppProfile = {
      ...apps[idx],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    }
    apps[idx] = updated
    writeApps(apps)
    return updated
  }

  function deleteApp(id: string): boolean {
    const apps = readApps()
    const idx = apps.findIndex((a) => a.id === id)
    if (idx < 0) return false
    apps.splice(idx, 1)
    writeApps(apps)
    return true
  }

  return { listApps, getApp, saveApp, updateApp, deleteApp }
}

const DEFAULT_DATA_DIR = join(process.cwd(), ".data")
const defaultStore = createAppStore(DEFAULT_DATA_DIR)

export const { listApps, getApp, saveApp, updateApp, deleteApp } = defaultStore

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { z } from "zod"
import type { StoreKitDiagnosticsSpec } from "./types"

// File-based JSON storage for StoreKit diagnostics specs.
// Data lives at <project-root>/.data/storekit-specs.json.
// NOTE: This is a simple local store for the MVP. Replace with a database for production.
// Limitations: no atomic writes (race conditions possible under concurrent requests),
// no transaction support, and unbounded file growth for long-running instances.

const DATA_DIR = join(process.cwd(), ".data")
const SPECS_FILE = join(DATA_DIR, "storekit-specs.json")

const StoredSpecSchema = z.object({
  id: z.string(),
  appId: z.string(),
  summary: z.string(),
  riskLevel: z.enum(["low", "medium", "high"]),
  requiredDiagnostics: z.array(z.unknown()),
  reviewerSafeDisplayFields: z.array(z.unknown()),
  implementationChecklist: z.array(z.unknown()),
  appReviewNotes: z.string(),
  githubTask: z.unknown(),
  swiftImplementationNotes: z.array(z.string()),
  createdAt: z.string(),
})

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readSpecs(): StoreKitDiagnosticsSpec[] {
  try {
    if (!existsSync(SPECS_FILE)) return []
    const raw = readFileSync(SPECS_FILE, "utf-8")
    const parsed: unknown[] = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => {
      const result = StoredSpecSchema.safeParse(item)
      if (!result.success) {
        console.warn("[storekit-store] Skipping invalid spec record:", result.error.flatten())
      }
      return result.success
    }) as StoreKitDiagnosticsSpec[]
  } catch {
    return []
  }
}

function writeSpecs(specs: StoreKitDiagnosticsSpec[]): void {
  ensureDataDir()
  writeFileSync(SPECS_FILE, JSON.stringify(specs, null, 2), "utf-8")
}

export function saveSpec(spec: StoreKitDiagnosticsSpec): void {
  const specs = readSpecs()
  const idx = specs.findIndex((s) => s.id === spec.id)
  if (idx >= 0) {
    specs[idx] = spec
  } else {
    specs.push(spec)
  }
  writeSpecs(specs)
}

export function getSpec(id: string): StoreKitDiagnosticsSpec | undefined {
  return readSpecs().find((s) => s.id === id)
}

export function getSpecsForApp(appId: string): StoreKitDiagnosticsSpec[] {
  return readSpecs()
    .filter((s) => s.appId === appId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { z } from "zod"
import type { ReleasePackage } from "@schemas/release-package"

const ReleasePackageArtifactSchema = z.object({
  type: z.enum(["release-audit", "storekit", "app-review", "aso", "task-bundle"]),
  id: z.string(),
  included: z.boolean(),
  summary: z.string(),
})

const StoredReleasePackageSchema = z.object({
  id: z.string(),
  appId: z.string(),
  releaseName: z.string(),
  version: z.string().optional(),
  buildNumber: z.string().optional(),
  summary: z.string(),
  readinessStatus: z.enum(["ready", "needs-work", "blocked"]),
  riskLevel: z.enum(["low", "medium", "high"]),
  includedArtifacts: z.array(ReleasePackageArtifactSchema),
  appReviewSubmissionNotes: z.string(),
  testFlightChecklist: z.array(z.string()),
  appReviewChecklist: z.array(z.string()),
  storeKitChecklist: z.array(z.string()),
  metadataChecklist: z.array(z.string()),
  blockingIssues: z.array(z.string()),
  recommendedNextActions: z.array(z.string()),
  releasePacketMarkdown: z.string(),
  agentExecutionBrief: z.string(),
  createdAt: z.string(),
})

export function createReleasePackageStore(dataDir: string) {
  const packagesFile = join(dataDir, "release-packages.json")

  function ensureDir(): void {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  function readPackages(): ReleasePackage[] {
    try {
      if (!existsSync(packagesFile)) return []
      const raw = readFileSync(packagesFile, "utf-8")
      const parsed: unknown[] = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed
        .map((item) => StoredReleasePackageSchema.safeParse(item))
        .filter((result) => result.success)
        .map((result) => result.data as ReleasePackage)
    } catch {
      return []
    }
  }

  function writePackages(packages: ReleasePackage[]): void {
    ensureDir()
    writeFileSync(packagesFile, JSON.stringify(packages, null, 2), "utf-8")
  }

  function saveReleasePackage(pkg: ReleasePackage): void {
    const packages = readPackages()
    const idx = packages.findIndex((p) => p.id === pkg.id)
    if (idx >= 0) {
      packages[idx] = pkg
    } else {
      packages.push(pkg)
    }
    writePackages(packages)
  }

  function getReleasePackage(id: string): ReleasePackage | undefined {
    return readPackages().find((p) => p.id === id)
  }

  function getReleasePackagesForApp(appId: string): ReleasePackage[] {
    return readPackages()
      .filter((p) => p.appId === appId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  function getLatestReleasePackageForApp(appId: string): ReleasePackage | undefined {
    return getReleasePackagesForApp(appId)[0]
  }

  return {
    saveReleasePackage,
    getReleasePackage,
    getReleasePackagesForApp,
    getLatestReleasePackageForApp,
  }
}

const DEFAULT_DATA_DIR = join(process.cwd(), ".data")
const defaultStore = createReleasePackageStore(DEFAULT_DATA_DIR)

export const {
  saveReleasePackage,
  getReleasePackage,
  getReleasePackagesForApp,
  getLatestReleasePackageForApp,
} = defaultStore

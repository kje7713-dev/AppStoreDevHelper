import { describe, it, expect, beforeEach } from "vitest"
import { mkdirSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { createReleasePackageStore } from "@web/lib/release-package-store"
import type { ReleasePackage } from "@schemas/release-package"

function makeTempDir(): string {
  const dir = join(
    tmpdir(),
    `release-package-store-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
  mkdirSync(dir, { recursive: true })
  return dir
}

function makePackage(overrides: Partial<ReleasePackage> = {}): ReleasePackage {
  return {
    id: "pkg-1",
    appId: "app-1",
    releaseName: "v1.0.0",
    version: "1.0.0",
    buildNumber: "100",
    summary: "Summary",
    readinessStatus: "ready",
    riskLevel: "low",
    includedArtifacts: [],
    appReviewSubmissionNotes: "notes",
    testFlightChecklist: [],
    appReviewChecklist: [],
    storeKitChecklist: [],
    metadataChecklist: [],
    blockingIssues: [],
    recommendedNextActions: [],
    releasePacketMarkdown: "# Packet",
    agentExecutionBrief: "Brief",
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("createReleasePackageStore", () => {
  let dataDir: string
  let store: ReturnType<typeof createReleasePackageStore>

  beforeEach(() => {
    dataDir = makeTempDir()
    store = createReleasePackageStore(dataDir)
  })

  it("saves and retrieves a package by id", () => {
    const pkg = makePackage()
    store.saveReleasePackage(pkg)
    expect(store.getReleasePackage(pkg.id)).toEqual(pkg)
  })

  it("returns app packages newest first", () => {
    const older = makePackage({ id: "pkg-old", createdAt: "2026-01-01T00:00:00.000Z" })
    const newer = makePackage({ id: "pkg-new", createdAt: "2026-01-02T00:00:00.000Z" })
    store.saveReleasePackage(older)
    store.saveReleasePackage(newer)
    const list = store.getReleasePackagesForApp("app-1")
    expect(list.map((p) => p.id)).toEqual(["pkg-new", "pkg-old"])
  })

  it("returns latest package for app", () => {
    store.saveReleasePackage(
      makePackage({ id: "pkg-a", createdAt: "2026-01-01T00:00:00.000Z" })
    )
    store.saveReleasePackage(
      makePackage({ id: "pkg-b", createdAt: "2026-01-03T00:00:00.000Z" })
    )
    expect(store.getLatestReleasePackageForApp("app-1")?.id).toBe("pkg-b")
  })

  it("is idempotent for same id", () => {
    store.saveReleasePackage(makePackage({ id: "pkg-1", releaseName: "First" }))
    store.saveReleasePackage(makePackage({ id: "pkg-1", releaseName: "Updated" }))
    const list = store.getReleasePackagesForApp("app-1")
    expect(list).toHaveLength(1)
    expect(list[0].releaseName).toBe("Updated")
  })
})

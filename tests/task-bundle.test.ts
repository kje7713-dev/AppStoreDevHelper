import { describe, it, expect } from "vitest"
import { generateTaskBundle } from "@core/tasks"
import type { TaskBundleInput, TaskBundleSources } from "@schemas/task-bundle"

// ── Fixtures ──────────────────────────────────────────────────────────────────

const APP_ID = "test-app-123"

const mockAuditSource: TaskBundleSources["releaseAudit"] = {
  githubTasks: [
    {
      title: "[AppReview] Add reviewer notes",
      priority: "high",
      summary: "Include demo account in App Review notes.",
      acceptanceCriteria: ["Reviewer notes include demo credentials", "Notes describe all features"],
      labels: ["app-review", "high"],
    },
    {
      title: "[ASO] Add keywords",
      priority: "low",
      summary: "App is missing keywords metadata.",
      acceptanceCriteria: ["Keywords field is populated in App Store Connect"],
      labels: ["aso", "metadata", "low"],
    },
  ],
}

const mockStoreKitSource: TaskBundleSources["storeKitSpec"] = {
  githubTask: {
    title: "[StoreKit] Add reviewer-safe debug panel",
    priority: "medium",
    summary: "Add a debug panel showing IAP status.",
    acceptanceCriteria: ["Debug panel shows product IDs", "Panel is only visible in debug builds"],
    labels: ["storekit", "medium"],
  },
}

const mockAppReviewSource: TaskBundleSources["appReviewResponse"] = {
  internalTasks: [
    {
      title: "[AppReview] Fix StoreKit rejection (Guideline 3.1.1)",
      priority: "high",
      summary: "Address the App Review rejection for Guideline 3.1.1.",
      acceptanceCriteria: ["Products load in sandbox", "Purchase flow completes"],
      labels: ["app-review", "storekit", "high"],
    },
    {
      title: "[AppReview] Update reviewer notes and testing instructions",
      priority: "medium",
      summary: "Ensure App Review notes include testing instructions.",
      acceptanceCriteria: ["Notes include step-by-step instructions"],
      labels: ["app-review", "documentation"],
    },
  ],
}

const mockAsoSource: TaskBundleSources["asoOutput"] = {
  githubTask: {
    title: "[ASO] Update App Store metadata for Test App",
    priority: "medium",
    summary: "Apply generated ASO metadata to App Store Connect.",
    acceptanceCriteria: ["Subtitle is updated (max 30 chars)", "Keywords are updated"],
    labels: ["aso", "app-store", "metadata"],
  },
}

function makeInput(overrides: Partial<TaskBundleInput> = {}): TaskBundleInput {
  return {
    includeReleaseAuditTasks: true,
    includeStoreKitTasks: true,
    includeAppReviewTasks: true,
    includeAsoTasks: true,
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("generateTaskBundle", () => {
  it("returns a valid bundle object with required fields", () => {
    const bundle = generateTaskBundle(APP_ID, makeInput(), {
      releaseAudit: mockAuditSource,
      storeKitSpec: mockStoreKitSource,
      appReviewResponse: mockAppReviewSource,
      asoOutput: mockAsoSource,
    })

    expect(bundle.id).toBeTruthy()
    expect(bundle.appId).toBe(APP_ID)
    expect(typeof bundle.summary).toBe("string")
    expect(typeof bundle.taskCount).toBe("number")
    expect(Array.isArray(bundle.tasks)).toBe(true)
    expect(typeof bundle.bundleMarkdown).toBe("string")
    expect(typeof bundle.agentImplementationBrief).toBe("string")
    expect(typeof bundle.createdAt).toBe("string")
    expect(Array.isArray(bundle.warnings)).toBe(true)
  })

  it("includes tasks from all sources when all are enabled", () => {
    const bundle = generateTaskBundle(APP_ID, makeInput(), {
      releaseAudit: mockAuditSource,
      storeKitSpec: mockStoreKitSource,
      appReviewResponse: mockAppReviewSource,
      asoOutput: mockAsoSource,
    })

    const sources = bundle.tasks.map((t) => t.source)
    expect(sources).toContain("release-audit")
    expect(sources).toContain("storekit")
    expect(sources).toContain("app-review")
    expect(sources).toContain("aso")
    expect(bundle.taskCount).toBe(bundle.tasks.length)
    expect(bundle.warnings).toHaveLength(0)
  })

  it("adds a warning when a source is missing and skips it", () => {
    const bundle = generateTaskBundle(APP_ID, makeInput(), {
      releaseAudit: mockAuditSource,
      storeKitSpec: undefined,
      appReviewResponse: undefined,
      asoOutput: mockAsoSource,
    })

    expect(bundle.warnings.length).toBeGreaterThanOrEqual(2)
    const sources = bundle.tasks.map((t) => t.source)
    expect(sources).not.toContain("storekit")
    expect(sources).not.toContain("app-review")
  })

  it("respects priorityFloor and excludes lower-priority tasks", () => {
    const bundle = generateTaskBundle(
      APP_ID,
      makeInput({ priorityFloor: "high" }),
      {
        releaseAudit: mockAuditSource,
        storeKitSpec: mockStoreKitSource,
        appReviewResponse: mockAppReviewSource,
        asoOutput: mockAsoSource,
      }
    )

    for (const task of bundle.tasks) {
      expect(task.priority).toBe("high")
    }
  })

  it("applies labelPrefix to all task labels", () => {
    const bundle = generateTaskBundle(
      APP_ID,
      makeInput({ labelPrefix: "appops" }),
      {
        releaseAudit: mockAuditSource,
        storeKitSpec: mockStoreKitSource,
        appReviewResponse: mockAppReviewSource,
        asoOutput: mockAsoSource,
      }
    )

    for (const task of bundle.tasks) {
      for (const label of task.labels) {
        expect(label).toMatch(/^appops\//)
      }
    }
  })

  it("deduplicates tasks with identical titles", () => {
    const duplicateSource: TaskBundleSources = {
      releaseAudit: {
        githubTasks: [
          {
            title: "[AppReview] Add reviewer notes",
            priority: "high",
            summary: "Duplicate task",
            acceptanceCriteria: ["Criterion 1"],
            labels: ["app-review"],
          },
        ],
      },
      appReviewResponse: {
        internalTasks: [
          {
            title: "[AppReview] Add reviewer notes",
            priority: "high",
            summary: "Same title different source",
            acceptanceCriteria: ["Criterion 2"],
            labels: ["app-review"],
          },
        ],
      },
    }

    const bundle = generateTaskBundle(APP_ID, makeInput(), duplicateSource)
    const titles = bundle.tasks.map((t) => t.title)
    const uniqueTitles = [...new Set(titles.map((t) => t.toLowerCase().trim()))]
    expect(titles.length).toBe(uniqueTitles.length)
  })

  it("generates markdown for each task containing the title and acceptance criteria", () => {
    const bundle = generateTaskBundle(APP_ID, makeInput(), {
      releaseAudit: mockAuditSource,
    })

    for (const task of bundle.tasks) {
      expect(task.markdown).toContain(task.title)
      for (const c of task.acceptanceCriteria) {
        expect(task.markdown).toContain(c)
      }
    }
  })

  it("generates bundleMarkdown containing all task titles", () => {
    const bundle = generateTaskBundle(APP_ID, makeInput(), {
      releaseAudit: mockAuditSource,
      storeKitSpec: mockStoreKitSource,
    })

    for (const task of bundle.tasks) {
      expect(bundle.bundleMarkdown).toContain(task.title)
    }
  })

  it("generates a non-empty agentImplementationBrief", () => {
    const bundle = generateTaskBundle(APP_ID, makeInput(), {
      releaseAudit: mockAuditSource,
    })

    expect(bundle.agentImplementationBrief.length).toBeGreaterThan(100)
    expect(bundle.agentImplementationBrief).toContain(APP_ID)
  })

  it("returns empty task list and warnings when no sources are provided", () => {
    const bundle = generateTaskBundle(APP_ID, makeInput(), {})

    expect(bundle.tasks).toHaveLength(0)
    expect(bundle.taskCount).toBe(0)
    expect(bundle.warnings.length).toBeGreaterThan(0)
  })

  it("skips sources when their include flag is false", () => {
    const bundle = generateTaskBundle(
      APP_ID,
      makeInput({
        includeReleaseAuditTasks: false,
        includeStoreKitTasks: false,
        includeAppReviewTasks: true,
        includeAsoTasks: false,
      }),
      {
        releaseAudit: mockAuditSource,
        storeKitSpec: mockStoreKitSource,
        appReviewResponse: mockAppReviewSource,
        asoOutput: mockAsoSource,
      }
    )

    const sources = bundle.tasks.map((t) => t.source)
    expect(sources).not.toContain("release-audit")
    expect(sources).not.toContain("storekit")
    expect(sources).not.toContain("aso")
    expect(sources).toContain("app-review")
  })

  it("generates unique bundle IDs on each call", () => {
    const input = makeInput()
    const sources = { releaseAudit: mockAuditSource }
    const b1 = generateTaskBundle(APP_ID, input, sources)
    const b2 = generateTaskBundle(APP_ID, input, sources)
    expect(b1.id).not.toBe(b2.id)
  })

  it("taskCount matches the tasks array length", () => {
    const bundle = generateTaskBundle(APP_ID, makeInput(), {
      releaseAudit: mockAuditSource,
      storeKitSpec: mockStoreKitSource,
      appReviewResponse: mockAppReviewSource,
      asoOutput: mockAsoSource,
    })

    expect(bundle.taskCount).toBe(bundle.tasks.length)
  })

  it("adds a warning when an audit source has no tasks", () => {
    const bundle = generateTaskBundle(
      APP_ID,
      makeInput({ includeReleaseAuditTasks: true }),
      { releaseAudit: { githubTasks: [] } }
    )

    expect(bundle.warnings.some((w) => w.toLowerCase().includes("release audit"))).toBe(true)
  })
})

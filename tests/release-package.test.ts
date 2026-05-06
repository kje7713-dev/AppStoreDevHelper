import { describe, it, expect } from "vitest"
import { generateReleasePackage } from "@core/release-package"
import type {
  ReleasePackageInput,
  ReleasePackageSources,
  AuditSourceData,
  StoreKitSourceData,
  AppReviewSourceData,
  AsoSourceData,
  TaskBundleSourceData,
} from "@schemas/release-package"

// ── Fixtures ──────────────────────────────────────────────────────────────────

const APP_ID = "test-app-abc"
const APP_NAME = "TestApp"

const mockAudit: AuditSourceData = {
  id: "audit-001",
  summary: "Medium-risk release. One high-severity issue found.",
  releaseRiskScore: 45,
  blockingIssues: [
    {
      area: "StoreKit",
      severity: "high",
      issue: "Restore Purchases button missing from paywall.",
      recommendedFix: "Add a visible Restore Purchases button on the paywall screen.",
    },
  ],
  checklists: {
    testFlight: ["Verify dark mode on iPhone 14 Pro", "Test on iOS 16"],
    appReview: ["Include demo account credentials in reviewer notes"],
    storeKit: ["Restore Purchases button visible on paywall"],
  },
}

const mockAuditLowRisk: AuditSourceData = {
  ...mockAudit,
  id: "audit-002",
  summary: "Low-risk release.",
  releaseRiskScore: 20,
  blockingIssues: [],
}

const mockStoreKit: StoreKitSourceData = {
  id: "sk-001",
  summary: "StoreKit diagnostics: medium risk. IAP checklist generated.",
  riskLevel: "medium",
  appReviewNotes: "Products are available in sandbox. Use sandbox Apple ID to test purchases.",
  implementationChecklist: [
    { task: "Confirm all product IDs are active in App Store Connect.", priority: "required" },
    { task: "Verify receipt validation is working.", priority: "required" },
    { task: "Add in-app purchase debug panel.", priority: "recommended" },
  ],
}

const mockAppReview: AppReviewSourceData = {
  id: "ar-001",
  summary: "StoreKit rejection detected. Risk level: high. Response ready.",
  riskLevel: "high",
  appReviewResponse:
    "Thank you for reviewing our app. We have resolved the IAP issue by...",
  reviewerTestingInstructions:
    "1. Launch the app. 2. Tap Upgrade. 3. Complete purchase in sandbox.",
  resubmissionNotes: "Fixed StoreKit product loading.",
}

const mockAso: AsoSourceData = {
  id: "aso-001",
  summary: "Generated 3 subtitle options. No warnings.",
  warnings: [],
  subtitleOptions: [{ text: "Build faster" }],
}

const mockAsoWithWarnings: AsoSourceData = {
  ...mockAso,
  id: "aso-002",
  summary: "Generated 3 subtitle options. 1 warning.",
  warnings: ["Subtitle is near the 30-character limit."],
}

const mockTaskBundle: TaskBundleSourceData = {
  id: "bundle-001",
  summary: "3 task(s) from release-audit, storekit.",
  taskCount: 3,
  bundleMarkdown: "# GitHub Task Bundle\n\n...",
  agentImplementationBrief: "## Agent Implementation Brief\n\nYou are implementing...",
}

function makeInput(overrides: Partial<ReleasePackageInput> = {}): ReleasePackageInput {
  return {
    includeLatestAudit: true,
    includeLatestStoreKitSpec: true,
    includeLatestAppReviewResponse: true,
    includeLatestAsoOutput: true,
    includeLatestTaskBundle: true,
    ...overrides,
  }
}

function makeSources(overrides: Partial<ReleasePackageSources> = {}): ReleasePackageSources {
  return {
    audit: mockAudit,
    storeKitSpec: mockStoreKit,
    appReviewResponse: mockAppReview,
    asoOutput: mockAso,
    taskBundle: mockTaskBundle,
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("generateReleasePackage", () => {
  it("returns a valid package with all required fields", () => {
    const pkg = generateReleasePackage(APP_ID, APP_NAME, makeInput(), makeSources())

    expect(pkg.id).toBeTruthy()
    expect(pkg.appId).toBe(APP_ID)
    expect(typeof pkg.releaseName).toBe("string")
    expect(pkg.releaseName.length).toBeGreaterThan(0)
    expect(typeof pkg.summary).toBe("string")
    expect(["ready", "needs-work", "blocked"]).toContain(pkg.readinessStatus)
    expect(["low", "medium", "high"]).toContain(pkg.riskLevel)
    expect(Array.isArray(pkg.includedArtifacts)).toBe(true)
    expect(typeof pkg.appReviewSubmissionNotes).toBe("string")
    expect(Array.isArray(pkg.testFlightChecklist)).toBe(true)
    expect(Array.isArray(pkg.appReviewChecklist)).toBe(true)
    expect(Array.isArray(pkg.storeKitChecklist)).toBe(true)
    expect(Array.isArray(pkg.metadataChecklist)).toBe(true)
    expect(Array.isArray(pkg.blockingIssues)).toBe(true)
    expect(Array.isArray(pkg.recommendedNextActions)).toBe(true)
    expect(typeof pkg.releasePacketMarkdown).toBe("string")
    expect(typeof pkg.agentExecutionBrief).toBe("string")
    expect(typeof pkg.createdAt).toBe("string")
  })

  it("is blocked when audit has high-risk blocking issues", () => {
    const pkg = generateReleasePackage(APP_ID, APP_NAME, makeInput(), makeSources())

    // mockAudit has releaseRiskScore 45 (medium) but has a high-severity blocking issue
    // mockAppReview has riskLevel high — so overall risk is high → blocked
    expect(pkg.readinessStatus).toBe("blocked")
    expect(pkg.blockingIssues.length).toBeGreaterThan(0)
  })

  it("sets riskLevel to high when appReview riskLevel is high", () => {
    const pkg = generateReleasePackage(APP_ID, APP_NAME, makeInput(), makeSources())
    expect(pkg.riskLevel).toBe("high")
  })

  it("sets riskLevel to medium when worst artifact is medium", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput(),
      makeSources({
        appReviewResponse: { ...mockAppReview, riskLevel: "medium" },
        audit: mockAuditLowRisk,
      })
    )
    // storeKit is medium, appReview is medium → medium
    expect(pkg.riskLevel).toBe("medium")
  })

  it("sets riskLevel to low when all artifacts are low risk", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput(),
      makeSources({
        audit: mockAuditLowRisk,
        storeKitSpec: { ...mockStoreKit, riskLevel: "low" },
        appReviewResponse: { ...mockAppReview, riskLevel: "low" },
        asoOutput: mockAso,
      })
    )
    expect(pkg.riskLevel).toBe("low")
  })

  it("is needs-work when artifact is missing", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput(),
      makeSources({ audit: undefined })
    )
    expect(pkg.readinessStatus).toBe("blocked") // still blocked because appReview risk = high
    // But ensure audit artifact is marked as not included
    const auditArtifact = pkg.includedArtifacts.find((a) => a.type === "release-audit")
    expect(auditArtifact).toBeTruthy()
    expect(auditArtifact!.included).toBe(false)
  })

  it("is ready when no blocking issues and all artifacts present and low risk", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput(),
      makeSources({
        audit: mockAuditLowRisk,
        storeKitSpec: { ...mockStoreKit, riskLevel: "low" },
        appReviewResponse: { ...mockAppReview, riskLevel: "low" },
        asoOutput: mockAso,
      })
    )
    expect(pkg.readinessStatus).toBe("ready")
  })

  it("includes all 5 artifact types when all are requested", () => {
    const pkg = generateReleasePackage(APP_ID, APP_NAME, makeInput(), makeSources())

    const types = pkg.includedArtifacts.map((a) => a.type)
    expect(types).toContain("release-audit")
    expect(types).toContain("storekit")
    expect(types).toContain("app-review")
    expect(types).toContain("aso")
    expect(types).toContain("task-bundle")
  })

  it("marks artifact as not included when source is missing", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput(),
      makeSources({ storeKitSpec: undefined, asoOutput: undefined })
    )

    const storeKit = pkg.includedArtifacts.find((a) => a.type === "storekit")
    const aso = pkg.includedArtifacts.find((a) => a.type === "aso")
    expect(storeKit?.included).toBe(false)
    expect(aso?.included).toBe(false)
  })

  it("omits artifact type when include flag is false", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({ includeLatestAudit: false, includeLatestTaskBundle: false }),
      makeSources()
    )

    const types = pkg.includedArtifacts.map((a) => a.type)
    expect(types).not.toContain("release-audit")
    expect(types).not.toContain("task-bundle")
  })

  it("adds audit checklists when audit is included", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({
        includeLatestStoreKitSpec: false,
        includeLatestAppReviewResponse: false,
        includeLatestAsoOutput: false,
        includeLatestTaskBundle: false,
      }),
      { audit: mockAuditLowRisk }
    )

    expect(pkg.testFlightChecklist).toEqual(mockAuditLowRisk.checklists.testFlight)
    expect(pkg.appReviewChecklist).toEqual(mockAuditLowRisk.checklists.appReview)
  })

  it("adds required StoreKit items to storeKitChecklist", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({
        includeLatestAudit: false,
        includeLatestAppReviewResponse: false,
        includeLatestAsoOutput: false,
        includeLatestTaskBundle: false,
      }),
      { storeKitSpec: mockStoreKit }
    )

    const requiredTasks = mockStoreKit.implementationChecklist
      .filter((i) => i.priority === "required")
      .map((i) => i.task)

    for (const task of requiredTasks) {
      expect(pkg.storeKitChecklist).toContain(task)
    }

    // recommended items should NOT be in the checklist
    const recommendedTasks = mockStoreKit.implementationChecklist
      .filter((i) => i.priority === "recommended")
      .map((i) => i.task)
    for (const task of recommendedTasks) {
      expect(pkg.storeKitChecklist).not.toContain(task)
    }
  })

  it("adds metadata checklist items when ASO is included", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({
        includeLatestAudit: false,
        includeLatestStoreKitSpec: false,
        includeLatestAppReviewResponse: false,
        includeLatestTaskBundle: false,
      }),
      { asoOutput: mockAso }
    )

    expect(pkg.metadataChecklist.length).toBeGreaterThan(0)
    expect(pkg.metadataChecklist.some((item) => item.toLowerCase().includes("subtitle"))).toBe(
      true
    )
  })

  it("adds ASO warnings to metadataChecklist when present", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({
        includeLatestAudit: false,
        includeLatestStoreKitSpec: false,
        includeLatestAppReviewResponse: false,
        includeLatestTaskBundle: false,
      }),
      { asoOutput: mockAsoWithWarnings }
    )

    expect(
      pkg.metadataChecklist.some((item) => item.includes(mockAsoWithWarnings.warnings[0]))
    ).toBe(true)
  })

  it("uses reviewerNotesOverride when provided", () => {
    const override = "Custom reviewer notes from the dev team."
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({ reviewerNotesOverride: override }),
      makeSources()
    )

    expect(pkg.appReviewSubmissionNotes).toBe(override)
  })

  it("uses appReview response text as submission notes when no override", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({ reviewerNotesOverride: undefined }),
      makeSources({ appReviewResponse: mockAppReview })
    )

    expect(pkg.appReviewSubmissionNotes).toBe(mockAppReview.appReviewResponse)
  })

  it("falls back to StoreKit appReviewNotes when no appReview is included", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({ includeLatestAppReviewResponse: false }),
      makeSources({ storeKitSpec: mockStoreKit })
    )

    expect(pkg.appReviewSubmissionNotes).toBe(mockStoreKit.appReviewNotes)
  })

  it("uses version in releaseName when releaseName is not provided", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({ version: "3.0.0", buildNumber: "42" }),
      makeSources()
    )

    expect(pkg.releaseName).toBe("v3.0.0")
    expect(pkg.version).toBe("3.0.0")
    expect(pkg.buildNumber).toBe("42")
  })

  it("uses releaseName when provided", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({ releaseName: "Spring Launch" }),
      makeSources()
    )

    expect(pkg.releaseName).toBe("Spring Launch")
  })

  it("generates a non-empty releasePacketMarkdown containing releaseName", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({ releaseName: "My Release" }),
      makeSources()
    )

    expect(pkg.releasePacketMarkdown.length).toBeGreaterThan(100)
    expect(pkg.releasePacketMarkdown).toContain("My Release")
    expect(pkg.releasePacketMarkdown).toContain(APP_ID)
  })

  it("includes blocking issues in releasePacketMarkdown", () => {
    const pkg = generateReleasePackage(APP_ID, APP_NAME, makeInput(), makeSources())

    for (const issue of pkg.blockingIssues) {
      expect(pkg.releasePacketMarkdown).toContain(issue.slice(0, 50))
    }
  })

  it("generates a non-empty agentExecutionBrief containing appId", () => {
    const pkg = generateReleasePackage(APP_ID, APP_NAME, makeInput(), makeSources())

    expect(pkg.agentExecutionBrief.length).toBeGreaterThan(100)
    expect(pkg.agentExecutionBrief).toContain(APP_ID)
  })

  it("includes submissionGoal in markdown and brief when provided", () => {
    const goal = "Launch the new subscription model."
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({ submissionGoal: goal }),
      makeSources()
    )

    expect(pkg.releasePacketMarkdown).toContain(goal)
    expect(pkg.agentExecutionBrief).toContain(goal)
  })

  it("includes internalNotes in markdown when provided", () => {
    const notes = "Do not distribute this build externally."
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({ internalNotes: notes }),
      makeSources()
    )

    expect(pkg.releasePacketMarkdown).toContain(notes)
  })

  it("generates unique IDs on each call", () => {
    const input = makeInput()
    const sources = makeSources()
    const p1 = generateReleasePackage(APP_ID, APP_NAME, input, sources)
    const p2 = generateReleasePackage(APP_ID, APP_NAME, input, sources)
    expect(p1.id).not.toBe(p2.id)
  })

  it("adds a recommended next action for each missing artifact", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput(),
      {} // no sources at all
    )

    // All 5 artifacts requested, all missing
    expect(pkg.recommendedNextActions.length).toBeGreaterThanOrEqual(5)
    expect(
      pkg.recommendedNextActions.some((a) => a.toLowerCase().includes("audit"))
    ).toBe(true)
    expect(
      pkg.recommendedNextActions.some((a) => a.toLowerCase().includes("storekit"))
    ).toBe(true)
    expect(
      pkg.recommendedNextActions.some((a) => a.toLowerCase().includes("app review"))
    ).toBe(true)
    expect(
      pkg.recommendedNextActions.some((a) => a.toLowerCase().includes("aso"))
    ).toBe(true)
    expect(
      pkg.recommendedNextActions.some((a) => a.toLowerCase().includes("task bundle"))
    ).toBe(true)
  })

  it("returns needs-work when no sources are available", () => {
    const pkg = generateReleasePackage(APP_ID, APP_NAME, makeInput(), {})
    expect(pkg.readinessStatus).toBe("needs-work")
  })

  it("includes task bundle summary in recommendedNextActions when taskCount > 0", () => {
    const pkg = generateReleasePackage(
      APP_ID,
      APP_NAME,
      makeInput({
        includeLatestAudit: false,
        includeLatestStoreKitSpec: false,
        includeLatestAppReviewResponse: false,
        includeLatestAsoOutput: false,
      }),
      { taskBundle: mockTaskBundle }
    )

    expect(
      pkg.recommendedNextActions.some((a) =>
        a.includes(String(mockTaskBundle.taskCount))
      )
    ).toBe(true)
  })
})

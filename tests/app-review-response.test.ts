import { describe, it, expect } from "vitest"
import {
  detectIssueType,
  computeRiskLevel,
  collectMissingInfo,
  buildAppReviewResponse,
  buildReviewerTestingInstructions,
  buildInternalTasks,
  generateAppReviewResponse,
} from "@core/app-review"
import { AppReviewResponseInputSchema } from "@web/lib/schemas"
import type { AppReviewInput } from "@schemas/app-review"

function makeInput(overrides: Partial<AppReviewInput> = {}): AppReviewInput {
  return {
    rejectionText: "Your app was rejected.",
    desiredTone: "professional",
    ...overrides,
  }
}

// ── Schema validation ─────────────────────────────────────────────────────────

describe("AppReviewResponseInputSchema", () => {
  it("accepts a valid minimal payload", () => {
    const result = AppReviewResponseInputSchema.safeParse({
      rejectionText: "Your app was rejected for guideline 3.1.1.",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a full valid payload", () => {
    const result = AppReviewResponseInputSchema.safeParse({
      rejectionText: "Your app was rejected for guideline 3.1.1.",
      guideline: "Guideline 3.1.1",
      buildNumber: "42",
      appVersion: "1.0.0",
      deviceInfo: "iPhone 15 Pro, iOS 17.4",
      reviewerIssueSummary: "Reviewer could not find paywall",
      stepsAlreadyTaken: "Added a visible Restore Purchases button",
      testingInstructions: "Tap Upgrade in Settings",
      demoAccount: "demo@example.com / Demo1234",
      knownContext: "The paywall is accessible from the home screen",
      desiredTone: "professional",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a missing rejectionText", () => {
    const result = AppReviewResponseInputSchema.safeParse({ desiredTone: "professional" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.rejectionText).toBeDefined()
    }
  })

  it("rejects an empty rejectionText", () => {
    const result = AppReviewResponseInputSchema.safeParse({ rejectionText: "" })
    expect(result.success).toBe(false)
  })

  it("defaults desiredTone to professional when omitted", () => {
    const result = AppReviewResponseInputSchema.safeParse({
      rejectionText: "Rejected for guideline 4.0",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.desiredTone).toBe("professional")
    }
  })

  it("rejects an invalid desiredTone", () => {
    const result = AppReviewResponseInputSchema.safeParse({
      rejectionText: "Rejected",
      desiredTone: "aggressive",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a rejectionText exceeding 10000 chars", () => {
    const result = AppReviewResponseInputSchema.safeParse({
      rejectionText: "x".repeat(10001),
    })
    expect(result.success).toBe(false)
  })
})

// ── Issue type detection ──────────────────────────────────────────────────────

describe("detectIssueType", () => {
  it("detects StoreKit for in-app purchase mention", () => {
    expect(detectIssueType("Your app uses in-app purchase but the flow is broken.")).toBe("StoreKit")
  })

  it("detects StoreKit for subscription mention", () => {
    expect(detectIssueType("Subscription products were unavailable during review.")).toBe("StoreKit")
  })

  it("detects StoreKit for product unavailable", () => {
    expect(detectIssueType("Product unavailable when attempting to purchase.")).toBe("StoreKit")
  })

  it("detects Crash for crash mention", () => {
    expect(detectIssueType("The app crashes on launch on iPhone 15.")).toBe("Crash")
  })

  it("detects Crash for launch failure", () => {
    expect(detectIssueType("There was a launch failure when opening the app.")).toBe("Crash")
  })

  it("detects Login for demo account mention", () => {
    expect(detectIssueType("Please provide demo account credentials for review.")).toBe("Login")
  })

  it("detects Login for sign-in mention", () => {
    expect(detectIssueType("We could not sign in with the credentials provided.")).toBe("Login")
  })

  it("detects Privacy for privacy policy mention", () => {
    expect(detectIssueType("Your app must include a privacy policy link.")).toBe("Privacy")
  })

  it("detects Privacy for tracking mention", () => {
    expect(detectIssueType("Your app uses tracking without implementing ATT.")).toBe("Privacy")
  })

  it("detects Performance for slow mention", () => {
    expect(detectIssueType("The app was very slow to respond during testing.")).toBe("Performance")
  })

  it("detects Metadata for misleading screenshot mention", () => {
    expect(detectIssueType("The screenshots are misleading and do not match the app.")).toBe("Metadata")
  })

  it("detects Guideline for guideline number reference", () => {
    expect(detectIssueType("This violates guideline 4.0 of the App Store Review Guidelines.")).toBe(
      "Guideline"
    )
  })

  it("returns Other for unknown content", () => {
    expect(detectIssueType("We need more information from you.")).toBe("Other")
  })
})

// ── Risk level ────────────────────────────────────────────────────────────────

describe("computeRiskLevel", () => {
  it("returns high for Crash issue type", () => {
    expect(computeRiskLevel("Crash", makeInput())).toBe("high")
  })

  it("returns high for StoreKit issue type", () => {
    expect(computeRiskLevel("StoreKit", makeInput())).toBe("high")
  })

  it("returns high when stepsAlreadyTaken is empty", () => {
    expect(computeRiskLevel("Other", makeInput({ stepsAlreadyTaken: "" }))).toBe("high")
  })

  it("returns medium for Privacy when steps are provided", () => {
    expect(computeRiskLevel("Privacy", makeInput({ stepsAlreadyTaken: "Updated privacy policy" }))).toBe("medium")
  })

  it("returns medium for Login when steps are provided", () => {
    expect(computeRiskLevel("Login", makeInput({ stepsAlreadyTaken: "Added demo credentials" }))).toBe("medium")
  })

  it("returns low for Other when steps are provided", () => {
    expect(computeRiskLevel("Other", makeInput({ stepsAlreadyTaken: "Investigated and resolved" }))).toBe("low")
  })
})

// ── Missing info ──────────────────────────────────────────────────────────────

describe("collectMissingInfo", () => {
  it("flags missing stepsAlreadyTaken", () => {
    const missing = collectMissingInfo(makeInput({ stepsAlreadyTaken: undefined }))
    expect(missing.some((m) => m.includes("stepsAlreadyTaken"))).toBe(true)
  })

  it("flags missing testingInstructions", () => {
    const missing = collectMissingInfo(makeInput({ testingInstructions: undefined }))
    expect(missing.some((m) => m.includes("testingInstructions"))).toBe(true)
  })

  it("flags missing demoAccount", () => {
    const missing = collectMissingInfo(makeInput({ demoAccount: undefined }))
    expect(missing.some((m) => m.includes("demoAccount"))).toBe(true)
  })

  it("returns empty array when all key fields are provided", () => {
    const missing = collectMissingInfo(
      makeInput({
        stepsAlreadyTaken: "Added sandbox testing steps",
        testingInstructions: "1. Tap Upgrade. 2. Purchase.",
        demoAccount: "demo@example.com / Demo1234",
      })
    )
    expect(missing).toHaveLength(0)
  })
})

// ── App review response text ──────────────────────────────────────────────────

describe("buildAppReviewResponse", () => {
  it("does not claim a fix was made when stepsAlreadyTaken is empty", () => {
    const response = buildAppReviewResponse(makeInput({ stepsAlreadyTaken: undefined }), "Other")
    expect(response).not.toMatch(/we have fixed/i)
    expect(response).not.toMatch(/we fixed/i)
  })

  it("includes steps taken when stepsAlreadyTaken is provided", () => {
    const steps = "Added a visible Restore Purchases button"
    const response = buildAppReviewResponse(makeInput({ stepsAlreadyTaken: steps }), "StoreKit")
    expect(response).toContain(steps)
  })

  it("includes guideline reference when guideline is provided", () => {
    const response = buildAppReviewResponse(
      makeInput({ guideline: "Guideline 3.1.1" }),
      "StoreKit"
    )
    expect(response).toContain("Guideline 3.1.1")
  })

  it("includes demo account when provided", () => {
    const response = buildAppReviewResponse(
      makeInput({ demoAccount: "demo@test.com / pass123" }),
      "Login"
    )
    expect(response).toContain("demo@test.com / pass123")
  })

  it("does not sound hostile toward Apple", () => {
    const response = buildAppReviewResponse(makeInput(), "Other")
    expect(response).not.toMatch(/unfair/i)
    expect(response).not.toMatch(/wrong/i)
    expect(response).not.toMatch(/incorrect decision/i)
  })

  it("is copy-paste ready (non-empty string)", () => {
    const response = buildAppReviewResponse(makeInput(), "Other")
    expect(typeof response).toBe("string")
    expect(response.length).toBeGreaterThan(50)
  })
})

// ── Reviewer testing instructions ─────────────────────────────────────────────

describe("buildReviewerTestingInstructions", () => {
  it("includes provided testing instructions verbatim", () => {
    const instructions = "1. Open app. 2. Tap Upgrade. 3. Purchase."
    const result = buildReviewerTestingInstructions(
      makeInput({ testingInstructions: instructions }),
      "StoreKit"
    )
    expect(result).toContain(instructions)
  })

  it("includes version and build when provided", () => {
    const result = buildReviewerTestingInstructions(
      makeInput({ appVersion: "2.0.1", buildNumber: "88" }),
      "Other"
    )
    expect(result).toContain("2.0.1")
    expect(result).toContain("88")
  })

  it("includes demo account when provided", () => {
    const result = buildReviewerTestingInstructions(
      makeInput({ demoAccount: "user@test.com / secret" }),
      "Login"
    )
    expect(result).toContain("user@test.com / secret")
  })

  it("generates fallback steps when testingInstructions is empty", () => {
    const result = buildReviewerTestingInstructions(makeInput(), "StoreKit")
    expect(result).toContain("sandbox")
  })
})

// ── Internal tasks ────────────────────────────────────────────────────────────

describe("buildInternalTasks", () => {
  it("always returns at least one task", () => {
    const tasks = buildInternalTasks(makeInput(), "Other", "low")
    expect(tasks.length).toBeGreaterThan(0)
  })

  it("returns GitHub-ready tasks with required fields", () => {
    const tasks = buildInternalTasks(makeInput(), "StoreKit", "high")
    for (const task of tasks) {
      expect(typeof task.title).toBe("string")
      expect(["low", "medium", "high"]).toContain(task.priority)
      expect(typeof task.summary).toBe("string")
      expect(Array.isArray(task.acceptanceCriteria)).toBe(true)
      expect(task.acceptanceCriteria.length).toBeGreaterThan(0)
      expect(Array.isArray(task.labels)).toBe(true)
    }
  })

  it("includes a StoreKit-specific task for StoreKit rejections", () => {
    const tasks = buildInternalTasks(makeInput(), "StoreKit", "high")
    const hasStoreKitTask = tasks.some((t) => t.title.toLowerCase().includes("storekit") || t.title.toLowerCase().includes("purchase"))
    expect(hasStoreKitTask).toBe(true)
  })

  it("includes a crash task for Crash rejections", () => {
    const tasks = buildInternalTasks(makeInput(), "Crash", "high")
    const hasCrashTask = tasks.some((t) => t.title.toLowerCase().includes("crash") || t.title.toLowerCase().includes("stability"))
    expect(hasCrashTask).toBe(true)
  })

  it("includes a privacy task for Privacy rejections", () => {
    const tasks = buildInternalTasks(makeInput(), "Privacy", "medium")
    const hasPrivacyTask = tasks.some((t) => t.title.toLowerCase().includes("privacy"))
    expect(hasPrivacyTask).toBe(true)
  })
})

// ── Full generation ───────────────────────────────────────────────────────────

describe("generateAppReviewResponse", () => {
  it("returns a valid response object with all required fields", () => {
    const result = generateAppReviewResponse(
      "test-app-id",
      makeInput({ rejectionText: "Your app crashed on launch." })
    )

    expect(result.id).toBeTruthy()
    expect(result.appId).toBe("test-app-id")
    expect(typeof result.summary).toBe("string")
    expect(["StoreKit", "Metadata", "Crash", "Login", "Privacy", "Guideline", "Performance", "Other"]).toContain(
      result.detectedIssueType
    )
    expect(["low", "medium", "high"]).toContain(result.riskLevel)
    expect(typeof result.appReviewResponse).toBe("string")
    expect(typeof result.reviewerTestingInstructions).toBe("string")
    expect(typeof result.resubmissionNotes).toBe("string")
    expect(Array.isArray(result.internalTasks)).toBe(true)
    expect(Array.isArray(result.missingInfo)).toBe(true)
    expect(typeof result.createdAt).toBe("string")
  })

  it("detects StoreKit issue type for IAP rejection text", () => {
    const result = generateAppReviewResponse(
      "app-1",
      makeInput({ rejectionText: "The in-app purchase products could not be loaded during review." })
    )
    expect(result.detectedIssueType).toBe("StoreKit")
    expect(result.riskLevel).toBe("high")
  })

  it("detects Crash issue type", () => {
    const result = generateAppReviewResponse(
      "app-1",
      makeInput({ rejectionText: "The app crashed on launch during our review." })
    )
    expect(result.detectedIssueType).toBe("Crash")
  })

  it("detects Login issue type", () => {
    const result = generateAppReviewResponse(
      "app-1",
      makeInput({ rejectionText: "Please provide demo account credentials to access the app." })
    )
    expect(result.detectedIssueType).toBe("Login")
  })

  it("detects Privacy issue type", () => {
    const result = generateAppReviewResponse(
      "app-1",
      makeInput({ rejectionText: "Your app requires a privacy policy to be included." })
    )
    expect(result.detectedIssueType).toBe("Privacy")
  })

  it("includes missingInfo when stepsAlreadyTaken and testingInstructions are absent", () => {
    const result = generateAppReviewResponse(
      "app-1",
      makeInput({ stepsAlreadyTaken: undefined, testingInstructions: undefined })
    )
    expect(result.missingInfo.length).toBeGreaterThan(0)
  })

  it("returns empty missingInfo when all key fields are provided", () => {
    const result = generateAppReviewResponse(
      "app-1",
      makeInput({
        stepsAlreadyTaken: "Fixed the crash by updating the auth flow",
        testingInstructions: "1. Launch app. 2. Log in.",
        demoAccount: "demo@example.com / Demo1234",
      })
    )
    expect(result.missingInfo).toHaveLength(0)
  })

  it("generates unique IDs for each call", () => {
    const input = makeInput({ rejectionText: "Rejected for guideline 4.0" })
    const r1 = generateAppReviewResponse("app-1", input)
    const r2 = generateAppReviewResponse("app-1", input)
    expect(r1.id).not.toBe(r2.id)
  })

  it("sets appId correctly", () => {
    const result = generateAppReviewResponse("my-app-123", makeInput())
    expect(result.appId).toBe("my-app-123")
  })
})

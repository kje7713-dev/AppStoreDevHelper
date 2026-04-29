import { describe, it, expect } from "vitest"
import { CreateAppSchema, UpdateAppSchema } from "../packages/schemas/app-schema"
import { AuditInputSchema, ReleaseAuditSchema } from "../packages/schemas/release-schema"

describe("CreateAppSchema", () => {
  it("accepts a valid minimal app payload", () => {
    const result = CreateAppSchema.safeParse({ name: "My App" })
    expect(result.success).toBe(true)
  })

  it("accepts a full valid app payload", () => {
    const result = CreateAppSchema.safeParse({
      name: "My App",
      bundleId: "com.example.myapp",
      appStoreUrl: "https://apps.apple.com/app/id123",
      category: "Productivity",
      targetAudience: "Freelancers",
      businessModel: "subscription",
      currentMetadata: {
        subtitle: "Get more done",
        description: "A productivity app",
        keywords: "productivity,todo,tasks",
      },
    })
    expect(result.success).toBe(true)
  })

  it("rejects a payload missing the required name field", () => {
    const result = CreateAppSchema.safeParse({ bundleId: "com.example.myapp" })
    expect(result.success).toBe(false)
  })

  it("rejects an empty name", () => {
    const result = CreateAppSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined()
    }
  })

  it("rejects an invalid appStoreUrl", () => {
    const result = CreateAppSchema.safeParse({ name: "My App", appStoreUrl: "not-a-url" })
    expect(result.success).toBe(false)
  })

  it("accepts an empty string for optional appStoreUrl", () => {
    const result = CreateAppSchema.safeParse({ name: "My App", appStoreUrl: "" })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid businessModel value", () => {
    const result = CreateAppSchema.safeParse({ name: "My App", businessModel: "unknown_model" })
    expect(result.success).toBe(false)
  })

  it("accepts all valid businessModel values", () => {
    const models = ["free", "paid", "subscription", "iap", "freemium"] as const
    for (const model of models) {
      const result = CreateAppSchema.safeParse({ name: "My App", businessModel: model })
      expect(result.success).toBe(true)
    }
  })
})

describe("UpdateAppSchema", () => {
  it("accepts a partial payload", () => {
    const result = UpdateAppSchema.safeParse({ category: "Games" })
    expect(result.success).toBe(true)
  })

  it("accepts an empty object", () => {
    const result = UpdateAppSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe("AuditInputSchema", () => {
  it("accepts a valid audit input", () => {
    const result = AuditInputSchema.safeParse({
      latestChanges: "Fixed crash on startup",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a full audit input", () => {
    const result = AuditInputSchema.safeParse({
      latestChanges: "Fixed crash on startup",
      knownIssues: "Minor UI glitch on iPhone 14",
      testFlightNotes: "Use sandbox account: test@example.com / Password123",
      reviewerNotes: "Login with guest@example.com / pass123 to demo the app",
      previousRejectionText: "Guideline 2.1 - Performance - App Completeness",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a payload missing latestChanges", () => {
    const result = AuditInputSchema.safeParse({ reviewerNotes: "some notes" })
    expect(result.success).toBe(false)
  })

  it("rejects an empty latestChanges string", () => {
    const result = AuditInputSchema.safeParse({ latestChanges: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.latestChanges).toBeDefined()
    }
  })
})

describe("ReleaseAuditSchema", () => {
  it("accepts a valid audit object", () => {
    const result = ReleaseAuditSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      appId: "550e8400-e29b-41d4-a716-446655440001",
      releaseRiskScore: 45,
      summary: "Found 2 issues",
      blockingIssues: [
        {
          area: "AppReview",
          severity: "high",
          issue: "Missing reviewer notes",
          recommendedFix: "Add detailed reviewer notes",
        },
      ],
      checklists: {
        testFlight: ["Test on latest iOS"],
        appReview: ["Verify no crash on launch"],
      },
      githubTasks: [
        {
          title: "[AppReview] Missing reviewer notes",
          priority: "high",
          summary: "Add detailed reviewer notes",
          acceptanceCriteria: ["Reviewer notes added"],
          labels: ["app-store"],
        },
      ],
      createdAt: "2024-01-01T00:00:00.000Z",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a score out of range", () => {
    const result = ReleaseAuditSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      appId: "550e8400-e29b-41d4-a716-446655440001",
      releaseRiskScore: 150,
      summary: "Found issues",
      blockingIssues: [],
      checklists: { testFlight: [], appReview: [] },
      githubTasks: [],
      createdAt: "2024-01-01T00:00:00.000Z",
    })
    expect(result.success).toBe(false)
  })
})

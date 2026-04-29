import { describe, it, expect } from "vitest"
import { CreateAppProfileSchema, UpdateAppProfileSchema } from "../packages/schemas/app.zod"
import { ReleaseAuditInputSchema, ReleaseAuditSchema } from "../packages/schemas/release.zod"

describe("CreateAppProfileSchema", () => {
  it("accepts a valid minimal app profile", () => {
    const result = CreateAppProfileSchema.safeParse({ name: "My App" })
    expect(result.success).toBe(true)
  })

  it("rejects missing name", () => {
    const result = CreateAppProfileSchema.safeParse({})
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.name).toBeDefined()
  })

  it("rejects empty name", () => {
    const result = CreateAppProfileSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid businessModel", () => {
    const result = CreateAppProfileSchema.safeParse({ name: "App", businessModel: "invalid" })
    expect(result.success).toBe(false)
  })

  it("accepts valid businessModel values", () => {
    for (const model of ["free", "paid", "subscription", "iap", "freemium"]) {
      const result = CreateAppProfileSchema.safeParse({ name: "App", businessModel: model })
      expect(result.success).toBe(true)
    }
  })

  it("rejects invalid appStoreUrl", () => {
    const result = CreateAppProfileSchema.safeParse({ name: "App", appStoreUrl: "not-a-url" })
    expect(result.success).toBe(false)
  })

  it("accepts empty appStoreUrl", () => {
    const result = CreateAppProfileSchema.safeParse({ name: "App", appStoreUrl: "" })
    expect(result.success).toBe(true)
  })

  it("accepts full app profile", () => {
    const result = CreateAppProfileSchema.safeParse({
      name: "My App",
      bundleId: "com.example.app",
      appStoreUrl: "https://apps.apple.com/app/id123",
      category: "Productivity",
      targetAudience: "Developers",
      businessModel: "subscription",
      currentMetadata: {
        subtitle: "A great app",
        description: "Description here",
        keywords: "productivity,tools",
      },
    })
    expect(result.success).toBe(true)
  })
})

describe("UpdateAppProfileSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = UpdateAppProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts partial update", () => {
    const result = UpdateAppProfileSchema.safeParse({ name: "New Name" })
    expect(result.success).toBe(true)
  })
})

describe("ReleaseAuditInputSchema", () => {
  it("accepts valid input", () => {
    const result = ReleaseAuditInputSchema.safeParse({
      latestChanges: "Fixed crash on launch",
      reviewerNotes: "Please use test@example.com / password123 to log in",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing latestChanges", () => {
    const result = ReleaseAuditInputSchema.safeParse({})
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.latestChanges).toBeDefined()
  })

  it("rejects empty latestChanges", () => {
    const result = ReleaseAuditInputSchema.safeParse({ latestChanges: "" })
    expect(result.success).toBe(false)
  })

  it("accepts all optional fields", () => {
    const result = ReleaseAuditInputSchema.safeParse({
      latestChanges: "Bug fixes and performance improvements",
      knownIssues: "Some edge case on iPad",
      testFlightNotes: "Please test subscription flow",
      reviewerNotes: "Use demo@example.com / demo1234 to log in. Enable demo mode from settings.",
      previousRejectionText: "Guideline 4.0 - Design",
    })
    expect(result.success).toBe(true)
  })
})

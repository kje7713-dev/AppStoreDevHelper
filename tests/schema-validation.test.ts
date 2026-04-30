import { describe, it, expect } from "vitest"
import {
  CreateAppProfileSchema,
  ReleaseAuditInputSchema,
} from "@web/lib/schemas"

// ── App Profile Schema tests ───────────────────────────────────────────────────

describe("CreateAppProfileSchema", () => {
  it("accepts a valid minimal payload", () => {
    const result = CreateAppProfileSchema.safeParse({ name: "My App" })
    expect(result.success).toBe(true)
  })

  it("accepts a full valid payload", () => {
    const result = CreateAppProfileSchema.safeParse({
      name: "My App",
      bundleId: "com.example.myapp",
      appStoreUrl: "https://apps.apple.com/app/id123456789",
      category: "Productivity",
      targetAudience: "Indie developers",
      businessModel: "subscription",
      currentMetadata: {
        subtitle: "Your dev toolkit",
        keywords: "ios,swift,tools",
      },
    })
    expect(result.success).toBe(true)
  })

  it("rejects a missing name", () => {
    const result = CreateAppProfileSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      expect(fields.name).toBeDefined()
    }
  })

  it("rejects an empty name", () => {
    const result = CreateAppProfileSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid businessModel", () => {
    const result = CreateAppProfileSchema.safeParse({
      name: "My App",
      businessModel: "enterprise",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a malformed bundle ID", () => {
    const result = CreateAppProfileSchema.safeParse({
      name: "My App",
      bundleId: "invalid bundle id with spaces",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid App Store URL", () => {
    const result = CreateAppProfileSchema.safeParse({
      name: "My App",
      appStoreUrl: "not-a-url",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a subtitle longer than 30 chars", () => {
    const result = CreateAppProfileSchema.safeParse({
      name: "My App",
      currentMetadata: { subtitle: "A".repeat(31) },
    })
    expect(result.success).toBe(false)
  })
})

// ── Release Audit Input Schema tests ──────────────────────────────────────────

describe("ReleaseAuditInputSchema", () => {
  it("accepts a valid minimal payload", () => {
    const result = ReleaseAuditInputSchema.safeParse({
      latestChanges: "Fixed crash on launch",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a full valid payload", () => {
    const result = ReleaseAuditInputSchema.safeParse({
      latestChanges: "Added dark mode support",
      knownIssues: "Minor UI flicker on older devices",
      testFlightNotes: "Focus on dark mode toggle",
      reviewerNotes: "Use demo@example.com / password123 to log in",
      previousRejectionText: "App was rejected for guideline 4.0",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a missing latestChanges", () => {
    const result = ReleaseAuditInputSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      expect(fields.latestChanges).toBeDefined()
    }
  })

  it("rejects an empty latestChanges", () => {
    const result = ReleaseAuditInputSchema.safeParse({ latestChanges: "" })
    expect(result.success).toBe(false)
  })

  it("rejects latestChanges exceeding 10000 chars", () => {
    const result = ReleaseAuditInputSchema.safeParse({
      latestChanges: "x".repeat(10001),
    })
    expect(result.success).toBe(false)
  })
})

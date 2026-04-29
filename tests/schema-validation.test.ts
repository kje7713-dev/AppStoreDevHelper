import { describe, it, expect } from "vitest"
import { z } from "zod"

// ── Inline schema definitions for root-level tests ─────────────────────────────
// (Mirrors apps/web/lib/schemas.ts without needing the Next.js app context)

const AppMetadataSchema = z.object({
  subtitle: z.string().max(30).optional(),
  promotionalText: z.string().max(170).optional(),
  description: z.string().max(4000).optional(),
  keywords: z.string().max(100).optional(),
  releaseNotes: z.string().max(4000).optional(),
})

const CreateAppProfileSchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  bundleId: z
    .string()
    .regex(/^[a-zA-Z0-9\-\.]+$/, "Invalid bundle ID format")
    .optional(),
  appStoreUrl: z
    .string()
    .url("Invalid App Store URL")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  category: z.string().max(100).optional(),
  targetAudience: z.string().max(500).optional(),
  businessModel: z
    .enum(["free", "paid", "subscription", "iap", "freemium"])
    .optional(),
  currentMetadata: AppMetadataSchema.optional(),
})

const ReleaseAuditInputSchema = z.object({
  latestChanges: z.string().min(1, "latestChanges is required").max(10000),
  knownIssues: z.string().max(5000).optional(),
  testFlightNotes: z.string().max(5000).optional(),
  reviewerNotes: z.string().max(5000).optional(),
  previousRejectionText: z.string().max(5000).optional(),
})

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

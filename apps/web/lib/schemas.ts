import { z } from "zod"

// ── App Profile ────────────────────────────────────────────────────────────────

export const AppMetadataSchema = z.object({
  subtitle: z.string().max(30).optional(),
  promotionalText: z.string().max(170).optional(),
  description: z.string().max(4000).optional(),
  keywords: z.string().max(100).optional(),
  releaseNotes: z.string().max(4000).optional(),
})

export const CreateAppProfileSchema = z.object({
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

export const UpdateAppProfileSchema = CreateAppProfileSchema.partial()

// ── Release Audit ─────────────────────────────────────────────────────────────

export const ReleaseAuditInputSchema = z.object({
  latestChanges: z
    .string()
    .min(1, "latestChanges is required")
    .max(10000),
  knownIssues: z.string().max(5000).optional(),
  testFlightNotes: z.string().max(5000).optional(),
  reviewerNotes: z.string().max(5000).optional(),
  previousRejectionText: z.string().max(5000).optional(),
})

export type CreateAppProfileInput = z.infer<typeof CreateAppProfileSchema>
export type UpdateAppProfileInput = z.infer<typeof UpdateAppProfileSchema>
export type ReleaseAuditInput = z.infer<typeof ReleaseAuditInputSchema>

// ── StoreKit Diagnostics ──────────────────────────────────────────────────────

export const StoreKitDiagnosticsInputSchema = z.object({
  productIds: z.array(z.string()).default([]),
  usesSubscriptions: z.boolean(),
  usesConsumables: z.boolean(),
  usesNonConsumables: z.boolean(),
  hasFreeTrial: z.boolean(),
  hasIntroOffer: z.boolean(),
  restorePurchaseImplemented: z.boolean(),
  paywallLocation: z.string().min(1, "paywallLocation is required").max(500),
  knownStoreKitIssue: z.string().max(2000).optional(),
  previousAppReviewIssue: z.string().max(2000).optional(),
  reviewerTestingPath: z.string().max(2000).optional(),
  usesStoreKit2: z.boolean().optional(),
  hasServerReceiptValidation: z.boolean().optional(),
})

export type StoreKitDiagnosticsInput = z.infer<typeof StoreKitDiagnosticsInputSchema>

// ── App Review Response ───────────────────────────────────────────────────────

export const AppReviewResponseInputSchema = z.object({
  rejectionText: z.string().min(1, "rejectionText is required").max(10000),
  guideline: z.string().max(200).optional(),
  buildNumber: z.string().max(50).optional(),
  appVersion: z.string().max(50).optional(),
  deviceInfo: z.string().max(200).optional(),
  reviewerIssueSummary: z.string().max(2000).optional(),
  stepsAlreadyTaken: z.string().max(5000).optional(),
  testingInstructions: z.string().max(5000).optional(),
  demoAccount: z.string().max(500).optional(),
  knownContext: z.string().max(5000).optional(),
  desiredTone: z.enum(["professional", "concise", "technical", "firm"]).default("professional"),
})

export type AppReviewResponseInput = z.infer<typeof AppReviewResponseInputSchema>

// ── ASO Metadata Generator ────────────────────────────────────────────────────

export const AsoGenerateInputSchema = z.object({
  appName: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  targetAudience: z.string().max(500).optional(),
  primaryBenefit: z.string().max(500).optional(),
  differentiators: z.array(z.string().max(200)).max(10).optional(),
  competitorApps: z.array(z.string().max(100)).max(10).optional(),
  currentSubtitle: z.string().max(30).optional(),
  currentKeywords: z.string().max(100).optional(),
  currentPromotionalText: z.string().max(170).optional(),
  currentDescription: z.string().max(4000).optional(),
  tone: z.enum(["professional", "direct", "bold", "minimal"]).default("professional"),
  includeNegativeKeywords: z.boolean().optional(),
  localization: z.enum(["none", "starter"]).optional(),
})

export type AsoGenerateInput = z.infer<typeof AsoGenerateInputSchema>

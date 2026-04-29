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

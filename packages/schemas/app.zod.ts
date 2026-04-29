import { z } from "zod"

export const AppMetadataSchema = z.object({
  subtitle: z.string().max(30).optional(),
  promotionalText: z.string().max(170).optional(),
  description: z.string().max(4000).optional(),
  keywords: z.string().max(100).optional(),
  releaseNotes: z.string().max(4000).optional(),
})

export const CreateAppProfileSchema = z.object({
  name: z.string().min(1, "App name is required").max(255),
  bundleId: z.string().optional(),
  appStoreUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().optional(),
  targetAudience: z.string().optional(),
  businessModel: z.enum(["free", "paid", "subscription", "iap", "freemium"]).optional(),
  currentMetadata: AppMetadataSchema.optional(),
})

export const UpdateAppProfileSchema = CreateAppProfileSchema.partial()

export type CreateAppProfileInput = z.infer<typeof CreateAppProfileSchema>
export type UpdateAppProfileInput = z.infer<typeof UpdateAppProfileSchema>

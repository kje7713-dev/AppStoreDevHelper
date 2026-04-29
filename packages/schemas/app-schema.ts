import { z } from "zod"

export const AppMetadataSchema = z.object({
  subtitle: z.string().optional(),
  promotionalText: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  releaseNotes: z.string().optional(),
})

export const CreateAppSchema = z.object({
  name: z.string().min(1, "App name is required"),
  bundleId: z.string().optional(),
  appStoreUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().optional(),
  targetAudience: z.string().optional(),
  businessModel: z.enum(["free", "paid", "subscription", "iap", "freemium"]).optional(),
  currentMetadata: AppMetadataSchema.optional(),
})

export const UpdateAppSchema = CreateAppSchema.partial()

export type CreateAppInput = z.infer<typeof CreateAppSchema>
export type UpdateAppInput = z.infer<typeof UpdateAppSchema>

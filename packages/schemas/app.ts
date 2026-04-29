export type AppProfile = {
  id: string
  name: string
  platform: "ios"
  bundleId?: string
  appStoreUrl?: string
  category?: string
  targetAudience?: string
  businessModel?: "free" | "paid" | "subscription" | "iap" | "freemium"
  currentMetadata?: AppMetadata
  createdAt: string
  updatedAt: string
}

export type AppMetadata = {
  subtitle?: string
  promotionalText?: string
  description?: string
  keywords?: string
  releaseNotes?: string
}

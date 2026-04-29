export type AppProfile = {
  id: string
  name: string
  platform: "ios"
  bundleId?: string
  appStoreUrl?: string
  category?: string
  targetAudience?: string
  businessModel?: "free" | "paid" | "subscription" | "iap" | "freemium"
  currentMetadata?: {
    subtitle?: string
    promotionalText?: string
    description?: string
    keywords?: string
    releaseNotes?: string
  }
  createdAt: string
  updatedAt: string
}

// Module-level singleton - persists across requests in the same Node.js process.
// NOTE: MVP/development only - data is lost on server restart. Replace with persistent storage for production.
export const apps = new Map<string, AppProfile>()

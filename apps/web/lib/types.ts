// Shared domain types for the AppOps Agent web app.
// These mirror the canonical definitions in packages/schemas/.

export type AppMetadata = {
  subtitle?: string
  promotionalText?: string
  description?: string
  keywords?: string
  releaseNotes?: string
}

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

export type ReleaseIssue = {
  area: "StoreKit" | "AppReview" | "TestFlight" | "Metadata" | "ASO" | "Ads" | "Other"
  severity: "low" | "medium" | "high"
  issue: string
  recommendedFix: string
}

export type GithubTask = {
  title: string
  priority: "low" | "medium" | "high"
  summary: string
  acceptanceCriteria: string[]
  labels?: string[]
}

export type ReleaseAudit = {
  id: string
  appId: string
  releaseRiskScore: number
  summary: string
  blockingIssues: ReleaseIssue[]
  checklists: {
    testFlight: string[]
    appReview: string[]
    storeKit?: string[]
  }
  githubTasks: GithubTask[]
  createdAt: string
}

// ── StoreKit Diagnostics ──────────────────────────────────────────────────────

export type DiagnosticField = {
  field: string
  description: string
  displayLabel: string
}

export type ImplementationChecklistItem = {
  id: string
  category: string
  task: string
  priority: "required" | "recommended" | "conditional"
  rationale: string
}

export type StoreKitDiagnosticsSpec = {
  id: string
  appId: string
  summary: string
  riskLevel: "low" | "medium" | "high"
  requiredDiagnostics: DiagnosticField[]
  reviewerSafeDisplayFields: DiagnosticField[]
  implementationChecklist: ImplementationChecklistItem[]
  appReviewNotes: string
  githubTask: GithubTask
  swiftImplementationNotes: string[]
  createdAt: string
}

// Shared domain types for the AppOps Agent web app.
// These mirror the canonical definitions in packages/schemas/.

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

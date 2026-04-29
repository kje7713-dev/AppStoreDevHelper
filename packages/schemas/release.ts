import { GithubTask } from "./task"

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

export type ReleaseIssue = {
  area: "StoreKit" | "AppReview" | "TestFlight" | "Metadata" | "ASO" | "Ads" | "Other"
  severity: "low" | "medium" | "high"
  issue: string
  recommendedFix: string
}

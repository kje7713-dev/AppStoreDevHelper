import { GithubTask } from "./task"

export type AppReviewIssueType =
  | "StoreKit"
  | "Metadata"
  | "Crash"
  | "Login"
  | "Privacy"
  | "Guideline"
  | "Performance"
  | "Other"

export type AppReviewRiskLevel = "low" | "medium" | "high"

export type AppReviewInput = {
  rejectionText: string
  guideline?: string
  buildNumber?: string
  appVersion?: string
  deviceInfo?: string
  reviewerIssueSummary?: string
  stepsAlreadyTaken?: string
  testingInstructions?: string
  demoAccount?: string
  knownContext?: string
  desiredTone: "professional" | "concise" | "technical" | "firm"
}

export type AppReviewResponse = {
  id: string
  appId: string
  summary: string
  detectedIssueType: AppReviewIssueType
  riskLevel: AppReviewRiskLevel
  appReviewResponse: string
  reviewerTestingInstructions: string
  resubmissionNotes: string
  internalTasks: GithubTask[]
  missingInfo: string[]
  createdAt: string
}

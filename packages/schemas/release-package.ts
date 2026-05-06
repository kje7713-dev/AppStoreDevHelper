// ── Release Package ───────────────────────────────────────────────────────────

export type ReleasePackageArtifactType =
  | "release-audit"
  | "storekit"
  | "app-review"
  | "aso"
  | "task-bundle"

export type ReadinessStatus = "ready" | "needs-work" | "blocked"
export type RiskLevel = "low" | "medium" | "high"

export type ReleasePackageArtifact = {
  type: ReleasePackageArtifactType
  id: string
  included: boolean
  summary: string
}

export type ReleasePackageInput = {
  releaseName?: string
  version?: string
  buildNumber?: string
  includeLatestAudit: boolean
  includeLatestStoreKitSpec: boolean
  includeLatestAppReviewResponse: boolean
  includeLatestAsoOutput: boolean
  includeLatestTaskBundle: boolean
  submissionGoal?: string
  reviewerNotesOverride?: string
  internalNotes?: string
  agentMode?: boolean
}

export type ReleasePackage = {
  id: string
  appId: string
  releaseName: string
  version?: string
  buildNumber?: string
  summary: string
  readinessStatus: ReadinessStatus
  riskLevel: RiskLevel
  includedArtifacts: ReleasePackageArtifact[]
  appReviewSubmissionNotes: string
  testFlightChecklist: string[]
  appReviewChecklist: string[]
  storeKitChecklist: string[]
  metadataChecklist: string[]
  blockingIssues: string[]
  recommendedNextActions: string[]
  releasePacketMarkdown: string
  agentExecutionBrief: string
  createdAt: string
}

// ── Source types passed to the core generator ─────────────────────────────────

export type AuditSourceData = {
  id: string
  summary: string
  releaseRiskScore: number
  blockingIssues: Array<{
    area: string
    severity: "low" | "medium" | "high"
    issue: string
    recommendedFix: string
  }>
  checklists: {
    testFlight: string[]
    appReview: string[]
    storeKit?: string[]
  }
}

export type StoreKitSourceData = {
  id: string
  summary: string
  riskLevel: "low" | "medium" | "high"
  appReviewNotes: string
  implementationChecklist: Array<{ task: string; priority: string }>
}

export type AppReviewSourceData = {
  id: string
  summary: string
  riskLevel: "low" | "medium" | "high"
  appReviewResponse: string
  reviewerTestingInstructions: string
  resubmissionNotes: string
}

export type AsoSourceData = {
  id: string
  summary: string
  warnings: string[]
  subtitleOptions: Array<{ text: string }>
}

export type TaskBundleSourceData = {
  id: string
  summary: string
  taskCount: number
  bundleMarkdown: string
  agentImplementationBrief: string
}

export type ReleasePackageSources = {
  audit?: AuditSourceData
  storeKitSpec?: StoreKitSourceData
  appReviewResponse?: AppReviewSourceData
  asoOutput?: AsoSourceData
  taskBundle?: TaskBundleSourceData
}

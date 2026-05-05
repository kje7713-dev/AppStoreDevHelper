import type { GithubTask } from "./task"

export type TaskSource = "release-audit" | "storekit" | "app-review" | "aso" | "manual"

export type TaskBundleInput = {
  includeReleaseAuditTasks: boolean
  includeStoreKitTasks: boolean
  includeAppReviewTasks: boolean
  includeAsoTasks: boolean
  releaseAuditId?: string
  storeKitSpecId?: string
  appReviewResponseId?: string
  asoOutputId?: string
  priorityFloor?: "low" | "medium" | "high"
  labelPrefix?: string
  agentMode?: boolean
}

export type TaskBundleTask = {
  title: string
  priority: "low" | "medium" | "high"
  source: TaskSource
  summary: string
  acceptanceCriteria: string[]
  labels: string[]
  markdown: string
}

export type TaskBundle = {
  id: string
  appId: string
  summary: string
  taskCount: number
  tasks: TaskBundleTask[]
  bundleMarkdown: string
  agentImplementationBrief: string
  createdAt: string
  warnings: string[]
}

// ── Source types consumed by the bundle generator ─────────────────────────────

export type AuditSource = {
  githubTasks: GithubTask[]
}

export type StoreKitSource = {
  githubTask: GithubTask
}

export type AppReviewSource = {
  internalTasks: GithubTask[]
}

export type AsoSource = {
  githubTask: GithubTask
}

export type TaskBundleSources = {
  releaseAudit?: AuditSource
  storeKitSpec?: StoreKitSource
  appReviewResponse?: AppReviewSource
  asoOutput?: AsoSource
}

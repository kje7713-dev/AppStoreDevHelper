import { z } from "zod"

export const ReleaseAuditInputSchema = z.object({
  latestChanges: z.string().min(1, "Latest changes are required"),
  knownIssues: z.string().optional(),
  testFlightNotes: z.string().optional(),
  reviewerNotes: z.string().optional(),
  previousRejectionText: z.string().optional(),
})

export const ReleaseIssueSchema = z.object({
  area: z.enum(["StoreKit", "AppReview", "TestFlight", "Metadata", "ASO", "Ads", "Other"]),
  severity: z.enum(["low", "medium", "high"]),
  issue: z.string().min(1),
  recommendedFix: z.string().min(1),
})

export const GithubTaskSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  summary: z.string().min(1),
  acceptanceCriteria: z.array(z.string()),
  labels: z.array(z.string()).optional(),
})

export const ReleaseAuditSchema = z.object({
  id: z.string().uuid(),
  appId: z.string().uuid(),
  releaseRiskScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  blockingIssues: z.array(ReleaseIssueSchema),
  checklists: z.object({
    testFlight: z.array(z.string()),
    appReview: z.array(z.string()),
    storeKit: z.array(z.string()).optional(),
  }),
  githubTasks: z.array(GithubTaskSchema),
  createdAt: z.string().datetime(),
})

export type ReleaseAuditInput = z.infer<typeof ReleaseAuditInputSchema>

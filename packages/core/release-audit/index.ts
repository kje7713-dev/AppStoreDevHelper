import { ReleaseAudit, ReleaseIssue } from "../../schemas/release"
import { GithubTask } from "../../schemas/task"
import { AppProfile } from "../../schemas/app"
import { randomUUID } from "crypto"

export type AuditInput = {
  app: AppProfile
  latestChanges: string
  knownIssues?: string
  testFlightNotes?: string
  reviewerNotes?: string
  previousRejectionText?: string
}

export function generateMockAudit(input: AuditInput): ReleaseAudit {
  const issues: ReleaseIssue[] = []

  if (!input.reviewerNotes || input.reviewerNotes.trim().length < 20) {
    issues.push({
      area: "AppReview",
      severity: "high",
      issue: "Reviewer notes are missing or too brief",
      recommendedFix: "Add detailed reviewer notes explaining all features, test credentials, and any edge cases.",
    })
  }

  if (input.app.businessModel === "subscription" && !input.testFlightNotes) {
    issues.push({
      area: "StoreKit",
      severity: "medium",
      issue: "Subscription app missing TestFlight StoreKit testing notes",
      recommendedFix: "Document sandbox account testing steps for all subscription tiers.",
    })
  }

  if (!input.app.currentMetadata?.keywords) {
    issues.push({
      area: "ASO",
      severity: "low",
      issue: "App keywords field is empty",
      recommendedFix: "Add relevant keywords to improve App Store discoverability.",
    })
  }

  const tasks: GithubTask[] = issues.map((issue) => ({
    title: `[AppStore] ${issue.issue}`,
    priority: issue.severity,
    summary: issue.recommendedFix,
    acceptanceCriteria: [`${issue.area} issue resolved: ${issue.issue}`],
    labels: ["app-store", issue.area.toLowerCase()],
  }))

  return {
    id: randomUUID(),
    appId: input.app.id,
    releaseRiskScore: Math.min(100, issues.length * 25 + (input.previousRejectionText ? 20 : 0)),
    summary: `Release audit for ${input.app.name}. Found ${issues.length} issue(s) that should be addressed before submission.`,
    blockingIssues: issues,
    checklists: {
      testFlight: [
        "Verify all critical user flows in TestFlight build",
        "Test on latest iOS version",
        "Test on minimum supported iOS version",
        "Verify push notifications (if applicable)",
        "Confirm in-app purchases work in sandbox",
      ],
      appReview: [
        "Complete reviewer notes with test credentials",
        "Verify app does not crash on launch",
        "Ensure all metadata is accurate and complete",
        "Check for placeholder content",
        "Review App Store guidelines for your category",
      ],
      storeKit: input.app.businessModel === "subscription" || input.app.businessModel === "iap"
        ? [
            "Test all subscription products in sandbox",
            "Verify restore purchases flow",
            "Test subscription cancellation and expiry",
            "Confirm paywall UI is compliant",
          ]
        : undefined,
    },
    githubTasks: tasks,
    createdAt: new Date().toISOString(),
  }
}

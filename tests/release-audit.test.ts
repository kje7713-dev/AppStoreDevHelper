import { describe, it, expect } from "vitest"
import { generateMockAudit } from "../packages/core/release-audit"
import type { AppProfile } from "../packages/schemas/app"

const baseApp: AppProfile = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "My Test App",
  platform: "ios",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
}

describe("generateMockAudit", () => {
  it("returns a valid audit structure", () => {
    const audit = generateMockAudit({
      app: baseApp,
      latestChanges: "Fixed crash on startup",
    })
    expect(audit.id).toBeTruthy()
    expect(audit.appId).toBe(baseApp.id)
    expect(typeof audit.releaseRiskScore).toBe("number")
    expect(audit.releaseRiskScore).toBeGreaterThanOrEqual(0)
    expect(audit.releaseRiskScore).toBeLessThanOrEqual(100)
    expect(typeof audit.summary).toBe("string")
    expect(Array.isArray(audit.blockingIssues)).toBe(true)
    expect(Array.isArray(audit.checklists.testFlight)).toBe(true)
    expect(Array.isArray(audit.checklists.appReview)).toBe(true)
    expect(Array.isArray(audit.githubTasks)).toBe(true)
    expect(audit.createdAt).toBeTruthy()
  })

  it("flags missing reviewer notes as a high-severity AppReview issue", () => {
    const audit = generateMockAudit({
      app: baseApp,
      latestChanges: "Bug fixes",
      reviewerNotes: "short",
    })
    const issue = audit.blockingIssues.find((i) => i.area === "AppReview")
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe("high")
  })

  it("does not flag reviewer notes when they are sufficiently detailed", () => {
    const audit = generateMockAudit({
      app: baseApp,
      latestChanges: "Bug fixes",
      reviewerNotes: "This is a detailed reviewer note that has more than twenty characters",
    })
    const issue = audit.blockingIssues.find((i) => i.area === "AppReview")
    expect(issue).toBeUndefined()
  })

  it("flags missing StoreKit test notes for a subscription app", () => {
    const audit = generateMockAudit({
      app: { ...baseApp, businessModel: "subscription" },
      latestChanges: "Added paywall",
    })
    const issue = audit.blockingIssues.find((i) => i.area === "StoreKit")
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe("medium")
  })

  it("includes a StoreKit checklist for subscription apps", () => {
    const audit = generateMockAudit({
      app: { ...baseApp, businessModel: "subscription" },
      latestChanges: "Added paywall",
    })
    expect(audit.checklists.storeKit).toBeDefined()
    expect(audit.checklists.storeKit!.length).toBeGreaterThan(0)
  })

  it("does not include a StoreKit checklist for free apps", () => {
    const audit = generateMockAudit({
      app: { ...baseApp, businessModel: "free" },
      latestChanges: "UI improvements",
    })
    expect(audit.checklists.storeKit).toBeUndefined()
  })

  it("flags missing keywords as an ASO issue", () => {
    const audit = generateMockAudit({
      app: { ...baseApp, currentMetadata: { keywords: undefined } },
      latestChanges: "Minor tweaks",
    })
    const issue = audit.blockingIssues.find((i) => i.area === "ASO")
    expect(issue).toBeDefined()
  })

  it("does not flag ASO when keywords are set", () => {
    const audit = generateMockAudit({
      app: { ...baseApp, currentMetadata: { keywords: "productivity,tasks" } },
      latestChanges: "Minor tweaks",
      reviewerNotes: "Use guest@example.com / pass123 to demo all features in the app",
    })
    const issue = audit.blockingIssues.find((i) => i.area === "ASO")
    expect(issue).toBeUndefined()
  })

  it("flags known issues as a medium-severity Other issue", () => {
    const audit = generateMockAudit({
      app: baseApp,
      latestChanges: "Performance improvements",
      knownIssues: "Minor UI glitch on older devices",
    })
    const issue = audit.blockingIssues.find((i) => i.area === "Other")
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe("medium")
  })

  it("increases risk score when a previous rejection is present", () => {
    const withoutRejection = generateMockAudit({
      app: baseApp,
      latestChanges: "Bug fixes",
      reviewerNotes: "Use guest@example.com / pass123 to demo all features",
    })
    const withRejection = generateMockAudit({
      app: baseApp,
      latestChanges: "Bug fixes",
      reviewerNotes: "Use guest@example.com / pass123 to demo all features",
      previousRejectionText: "Guideline 4.1 - Design - Copycats",
    })
    expect(withRejection.releaseRiskScore).toBeGreaterThan(withoutRejection.releaseRiskScore)
  })

  it("generates one github task per blocking issue", () => {
    const audit = generateMockAudit({
      app: { ...baseApp, businessModel: "subscription" },
      latestChanges: "New paywall",
      knownIssues: "Some known issue",
    })
    expect(audit.githubTasks.length).toBe(audit.blockingIssues.length)
  })

  it("caps risk score at 100", () => {
    const audit = generateMockAudit({
      app: { ...baseApp, businessModel: "subscription" },
      latestChanges: "Everything is broken",
      knownIssues: "Many issues",
      previousRejectionText: "Previous rejection text",
    })
    expect(audit.releaseRiskScore).toBeLessThanOrEqual(100)
  })
})

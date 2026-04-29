import { describe, it, expect } from "vitest"
import { generateMockAudit } from "../packages/core/release-audit"
import type { AppProfile } from "../packages/schemas/app"

function makeApp(overrides: Partial<AppProfile> = {}): AppProfile {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Test App",
    platform: "ios",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("generateMockAudit", () => {
  it("returns a release audit with required fields", () => {
    const audit = generateMockAudit({
      app: makeApp(),
      latestChanges: "Fixed crash on launch",
    })

    expect(audit.id).toBeTruthy()
    expect(audit.appId).toBe("00000000-0000-0000-0000-000000000001")
    expect(typeof audit.releaseRiskScore).toBe("number")
    expect(audit.releaseRiskScore).toBeGreaterThanOrEqual(0)
    expect(audit.releaseRiskScore).toBeLessThanOrEqual(100)
    expect(audit.summary).toBeTruthy()
    expect(Array.isArray(audit.blockingIssues)).toBe(true)
    expect(Array.isArray(audit.checklists.testFlight)).toBe(true)
    expect(Array.isArray(audit.checklists.appReview)).toBe(true)
    expect(Array.isArray(audit.githubTasks)).toBe(true)
    expect(audit.createdAt).toBeTruthy()
  })

  it("flags missing reviewer notes as a high severity issue", () => {
    const audit = generateMockAudit({
      app: makeApp(),
      latestChanges: "Bug fixes",
    })
    const issue = audit.blockingIssues.find((i) => i.area === "AppReview")
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe("high")
  })

  it("does not flag reviewer notes when sufficiently detailed", () => {
    const audit = generateMockAudit({
      app: makeApp(),
      latestChanges: "Bug fixes",
      reviewerNotes: "Use test@example.com / password123 to log in. All features are accessible without special setup.",
    })
    const appReviewIssue = audit.blockingIssues.find((i) => i.area === "AppReview")
    expect(appReviewIssue).toBeUndefined()
  })

  it("flags missing TestFlight notes for subscription apps", () => {
    const audit = generateMockAudit({
      app: makeApp({ businessModel: "subscription" }),
      latestChanges: "New subscription tier",
      reviewerNotes: "Use test@example.com / password123 to log in and access all subscription features.",
    })
    const storeKitIssue = audit.blockingIssues.find((i) => i.area === "StoreKit")
    expect(storeKitIssue).toBeDefined()
    expect(storeKitIssue?.severity).toBe("medium")
  })

  it("includes StoreKit checklist for subscription apps", () => {
    const audit = generateMockAudit({
      app: makeApp({ businessModel: "subscription" }),
      latestChanges: "Subscription improvements",
    })
    expect(Array.isArray(audit.checklists.storeKit)).toBe(true)
    expect(audit.checklists.storeKit!.length).toBeGreaterThan(0)
  })

  it("does not include StoreKit checklist for free apps", () => {
    const audit = generateMockAudit({
      app: makeApp({ businessModel: "free" }),
      latestChanges: "UI tweaks",
    })
    expect(audit.checklists.storeKit).toBeUndefined()
  })

  it("increases risk score when previous rejection text is present", () => {
    const withoutRejection = generateMockAudit({
      app: makeApp({ currentMetadata: { keywords: "app,tools" } }),
      latestChanges: "Bug fixes",
      reviewerNotes: "Use test@example.com / password123 to log in and access all features of the app.",
    })
    const withRejection = generateMockAudit({
      app: makeApp({ currentMetadata: { keywords: "app,tools" } }),
      latestChanges: "Bug fixes",
      reviewerNotes: "Use test@example.com / password123 to log in and access all features of the app.",
      previousRejectionText: "Guideline 4.0 - Design: ...",
    })
    expect(withRejection.releaseRiskScore).toBeGreaterThan(withoutRejection.releaseRiskScore)
  })

  it("flags missing keywords as an ASO issue", () => {
    const audit = generateMockAudit({
      app: makeApp({ currentMetadata: undefined }),
      latestChanges: "UI improvements",
    })
    const asoIssue = audit.blockingIssues.find((i) => i.area === "ASO")
    expect(asoIssue).toBeDefined()
  })

  it("generates GitHub tasks corresponding to blocking issues", () => {
    const audit = generateMockAudit({
      app: makeApp(),
      latestChanges: "Bug fixes",
    })
    expect(audit.githubTasks.length).toBe(audit.blockingIssues.length)
  })
})

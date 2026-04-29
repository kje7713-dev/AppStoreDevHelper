import { describe, it, expect } from "vitest"
import { generateMockAudit } from "@core/release-audit"
import type { AppProfile } from "@schemas/app"

function makeApp(overrides: Partial<AppProfile> = {}): AppProfile {
  const now = new Date().toISOString()
  return {
    id: "test-app-id",
    name: "Test App",
    platform: "ios",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe("generateMockAudit", () => {
  it("returns a valid audit object with required fields", () => {
    const audit = generateMockAudit({
      app: makeApp(),
      latestChanges: "Fixed crash on launch",
    })

    expect(audit.id).toBeTruthy()
    expect(audit.appId).toBe("test-app-id")
    expect(typeof audit.releaseRiskScore).toBe("number")
    expect(audit.releaseRiskScore).toBeGreaterThanOrEqual(0)
    expect(audit.releaseRiskScore).toBeLessThanOrEqual(100)
    expect(typeof audit.summary).toBe("string")
    expect(Array.isArray(audit.blockingIssues)).toBe(true)
    expect(Array.isArray(audit.checklists.testFlight)).toBe(true)
    expect(Array.isArray(audit.checklists.appReview)).toBe(true)
    expect(Array.isArray(audit.githubTasks)).toBe(true)
    expect(typeof audit.createdAt).toBe("string")
  })

  it("flags missing reviewer notes as a high severity AppReview issue", () => {
    const audit = generateMockAudit({
      app: makeApp(),
      latestChanges: "Bug fixes",
    })

    const issue = audit.blockingIssues.find((i) => i.area === "AppReview")
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe("high")
  })

  it("does not flag reviewer notes when they are sufficiently detailed", () => {
    const audit = generateMockAudit({
      app: makeApp(),
      latestChanges: "Bug fixes",
      reviewerNotes: "Use demo@test.com / pass123 to log in. Tap the plus button to add items.",
    })

    const issue = audit.blockingIssues.find((i) => i.area === "AppReview")
    expect(issue).toBeUndefined()
  })

  it("flags subscription app without TestFlight notes as StoreKit issue", () => {
    const audit = generateMockAudit({
      app: makeApp({ businessModel: "subscription" }),
      latestChanges: "New subscription tier",
    })

    const issue = audit.blockingIssues.find((i) => i.area === "StoreKit")
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe("medium")
  })

  it("does not flag StoreKit for subscription app that has TestFlight notes", () => {
    const audit = generateMockAudit({
      app: makeApp({ businessModel: "subscription" }),
      latestChanges: "New subscription tier",
      testFlightNotes: "Use sandbox account to test subscriptions",
    })

    const issue = audit.blockingIssues.find((i) => i.area === "StoreKit")
    expect(issue).toBeUndefined()
  })

  it("does not flag StoreKit for free apps", () => {
    const audit = generateMockAudit({
      app: makeApp({ businessModel: "free" }),
      latestChanges: "UI improvements",
    })

    const issue = audit.blockingIssues.find((i) => i.area === "StoreKit")
    expect(issue).toBeUndefined()
    expect(audit.checklists.storeKit).toBeUndefined()
  })

  it("includes storeKit checklist for iap apps", () => {
    const audit = generateMockAudit({
      app: makeApp({ businessModel: "iap" }),
      latestChanges: "New IAP product",
      testFlightNotes: "Test IAP in sandbox",
    })

    expect(Array.isArray(audit.checklists.storeKit)).toBe(true)
    expect(audit.checklists.storeKit!.length).toBeGreaterThan(0)
  })

  it("flags known issues as an Other severity medium issue", () => {
    const audit = generateMockAudit({
      app: makeApp(),
      latestChanges: "Feature update",
      knownIssues: "Minor flicker on iPad",
    })

    const issue = audit.blockingIssues.find((i) => i.area === "Other")
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe("medium")
  })

  it("flags missing keywords as a low severity ASO issue", () => {
    const audit = generateMockAudit({
      app: makeApp({ currentMetadata: { keywords: undefined } }),
      latestChanges: "New feature",
    })

    const issue = audit.blockingIssues.find((i) => i.area === "ASO")
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe("low")
  })

  it("does not flag ASO when keywords are present", () => {
    const audit = generateMockAudit({
      app: makeApp({ currentMetadata: { keywords: "ios,swift,productivity" } }),
      latestChanges: "Performance improvements",
      reviewerNotes: "All features are accessible without login. See README for details.",
    })

    const issue = audit.blockingIssues.find((i) => i.area === "ASO")
    expect(issue).toBeUndefined()
  })

  it("increases risk score when previousRejectionText is provided", () => {
    const withoutRejection = generateMockAudit({
      app: makeApp({ currentMetadata: { keywords: "test" } }),
      latestChanges: "Fix",
      reviewerNotes: "Use test@example.com / password to log in and explore",
    })

    const withRejection = generateMockAudit({
      app: makeApp({ currentMetadata: { keywords: "test" } }),
      latestChanges: "Fix",
      reviewerNotes: "Use test@example.com / password to log in and explore",
      previousRejectionText: "Guideline 4.0 - Design",
    })

    expect(withRejection.releaseRiskScore).toBeGreaterThan(withoutRejection.releaseRiskScore)
  })

  it("caps risk score at 100", () => {
    const audit = generateMockAudit({
      app: makeApp({ businessModel: "subscription" }),
      latestChanges: "Lots of changes",
      knownIssues: "Multiple known bugs",
      previousRejectionText: "Multiple rejections",
    })

    expect(audit.releaseRiskScore).toBeLessThanOrEqual(100)
  })

  it("generates a GitHub task for each blocking issue", () => {
    const audit = generateMockAudit({
      app: makeApp(),
      latestChanges: "Feature",
    })

    expect(audit.githubTasks.length).toBe(audit.blockingIssues.length)
  })

  it("generates unique audit IDs", () => {
    const app = makeApp()
    const input = { app, latestChanges: "change" }
    const a1 = generateMockAudit(input)
    const a2 = generateMockAudit(input)
    expect(a1.id).not.toBe(a2.id)
  })
})

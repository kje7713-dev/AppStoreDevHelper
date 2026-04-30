import { describe, it, expect } from "vitest"
import { generateStoreKitDiagnosticsSpec } from "@core/storekit"
import { StoreKitDiagnosticsInputSchema } from "@web/lib/schemas"
import type { StoreKitDiagnosticsInput } from "@schemas/storekit"

// ── Schema Validation ─────────────────────────────────────────────────────────

describe("StoreKitDiagnosticsInputSchema", () => {
  it("accepts a valid minimal payload", () => {
    const result = StoreKitDiagnosticsInputSchema.safeParse({
      productIds: [],
      usesSubscriptions: false,
      usesConsumables: false,
      usesNonConsumables: false,
      hasFreeTrial: false,
      hasIntroOffer: false,
      restorePurchaseImplemented: false,
      paywallLocation: "Home screen lock icon",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a full valid payload", () => {
    const result = StoreKitDiagnosticsInputSchema.safeParse({
      productIds: ["com.example.app.monthly", "com.example.app.annual"],
      usesSubscriptions: true,
      usesConsumables: false,
      usesNonConsumables: false,
      hasFreeTrial: true,
      hasIntroOffer: true,
      restorePurchaseImplemented: true,
      paywallLocation: "Settings → Upgrade",
      knownStoreKitIssue: "Occasionally returns empty products on first launch",
      previousAppReviewIssue: "Guideline 3.1.2 — restore purchases not working",
      reviewerTestingPath: "1. Open app 2. Tap Upgrade 3. Select monthly plan",
      usesStoreKit2: true,
      hasServerReceiptValidation: false,
    })
    expect(result.success).toBe(true)
  })

  it("defaults productIds to empty array when omitted", () => {
    const result = StoreKitDiagnosticsInputSchema.safeParse({
      usesSubscriptions: true,
      usesConsumables: false,
      usesNonConsumables: false,
      hasFreeTrial: false,
      hasIntroOffer: false,
      restorePurchaseImplemented: true,
      paywallLocation: "Home screen",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.productIds).toEqual([])
    }
  })

  it("rejects a missing paywallLocation", () => {
    const result = StoreKitDiagnosticsInputSchema.safeParse({
      productIds: [],
      usesSubscriptions: false,
      usesConsumables: false,
      usesNonConsumables: false,
      hasFreeTrial: false,
      hasIntroOffer: false,
      restorePurchaseImplemented: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.paywallLocation).toBeDefined()
    }
  })

  it("rejects an empty paywallLocation", () => {
    const result = StoreKitDiagnosticsInputSchema.safeParse({
      productIds: [],
      usesSubscriptions: false,
      usesConsumables: false,
      usesNonConsumables: false,
      hasFreeTrial: false,
      hasIntroOffer: false,
      restorePurchaseImplemented: false,
      paywallLocation: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing boolean fields", () => {
    const result = StoreKitDiagnosticsInputSchema.safeParse({
      productIds: [],
      paywallLocation: "Home",
    })
    expect(result.success).toBe(false)
  })
})

// ── Diagnostics Spec Generator ────────────────────────────────────────────────

function makeInput(overrides: Partial<StoreKitDiagnosticsInput> = {}): StoreKitDiagnosticsInput {
  return {
    productIds: ["com.example.monthly"],
    usesSubscriptions: true,
    usesConsumables: false,
    usesNonConsumables: false,
    hasFreeTrial: false,
    hasIntroOffer: false,
    restorePurchaseImplemented: true,
    paywallLocation: "Home screen",
    ...overrides,
  }
}

describe("generateStoreKitDiagnosticsSpec", () => {
  it("returns a valid spec with all required fields", () => {
    const spec = generateStoreKitDiagnosticsSpec("app-123", makeInput())

    expect(spec.id).toBeTruthy()
    expect(spec.appId).toBe("app-123")
    expect(typeof spec.summary).toBe("string")
    expect(["low", "medium", "high"]).toContain(spec.riskLevel)
    expect(Array.isArray(spec.requiredDiagnostics)).toBe(true)
    expect(spec.requiredDiagnostics.length).toBeGreaterThan(0)
    expect(Array.isArray(spec.reviewerSafeDisplayFields)).toBe(true)
    expect(spec.reviewerSafeDisplayFields.length).toBeGreaterThan(0)
    expect(Array.isArray(spec.implementationChecklist)).toBe(true)
    expect(spec.implementationChecklist.length).toBeGreaterThan(0)
    expect(typeof spec.appReviewNotes).toBe("string")
    expect(spec.githubTask).toBeDefined()
    expect(typeof spec.githubTask.title).toBe("string")
    expect(Array.isArray(spec.githubTask.acceptanceCriteria)).toBe(true)
    expect(Array.isArray(spec.swiftImplementationNotes)).toBe(true)
    expect(typeof spec.createdAt).toBe("string")
  })

  it("generates unique IDs for each spec", () => {
    const input = makeInput()
    const s1 = generateStoreKitDiagnosticsSpec("app-1", input)
    const s2 = generateStoreKitDiagnosticsSpec("app-1", input)
    expect(s1.id).not.toBe(s2.id)
  })

  it("sets riskLevel to high when usesSubscriptions is true and productIds is empty", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ usesSubscriptions: true, productIds: [] })
    )
    expect(spec.riskLevel).toBe("high")
  })

  it("sets riskLevel to high when usesConsumables is true and productIds is empty", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({
        usesSubscriptions: false,
        usesConsumables: true,
        productIds: [],
      })
    )
    expect(spec.riskLevel).toBe("high")
  })

  it("sets riskLevel to high when IAP is used and restorePurchaseImplemented is false", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ restorePurchaseImplemented: false })
    )
    expect(spec.riskLevel).toBe("high")
  })

  it("sets riskLevel to high when previousAppReviewIssue is present", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ previousAppReviewIssue: "Guideline 3.1.2 rejection" })
    )
    expect(spec.riskLevel).toBe("high")
  })

  it("sets riskLevel to medium when knownStoreKitIssue is present", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ knownStoreKitIssue: "Occasionally returns empty products" })
    )
    expect(spec.riskLevel).toBe("medium")
  })

  it("sets riskLevel to low when all IAP configured correctly", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({
        productIds: ["com.example.monthly"],
        usesSubscriptions: true,
        restorePurchaseImplemented: true,
        usesStoreKit2: true,
      })
    )
    expect(spec.riskLevel).toBe("low")
  })

  it("includes trial eligibility checklist items when hasFreeTrial is true", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ hasFreeTrial: true })
    )
    const trialItems = spec.implementationChecklist.filter((i) =>
      i.category === "Trial / Intro Offer"
    )
    expect(trialItems.length).toBeGreaterThan(0)
  })

  it("includes trial display field in requiredDiagnostics when hasFreeTrial is true", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ hasFreeTrial: true })
    )
    const field = spec.requiredDiagnostics.find(
      (f) => f.field === "trialIntroOfferDisplayState"
    )
    expect(field).toBeDefined()
  })

  it("does not include trial diagnostics when hasFreeTrial and hasIntroOffer are both false", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ hasFreeTrial: false, hasIntroOffer: false })
    )
    const field = spec.requiredDiagnostics.find(
      (f) => f.field === "trialIntroOfferDisplayState"
    )
    expect(field).toBeUndefined()
  })

  it("includes previousAppReviewIssue guidance in appReviewNotes", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ previousAppReviewIssue: "Guideline 3.1.2 — restore purchases not working" })
    )
    expect(spec.appReviewNotes).toContain("Previous App Review issue noted")
  })

  it("includes knownStoreKitIssue mitigation in appReviewNotes and checklist", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ knownStoreKitIssue: "Empty product list on cold start" })
    )
    expect(spec.appReviewNotes).toContain("Empty product list on cold start")
    const mitigationItem = spec.implementationChecklist.find(
      (i) => i.category === "Known Issue Mitigation"
    )
    expect(mitigationItem).toBeDefined()
  })

  it("includes StoreKit 2 checklist items when usesStoreKit2 is true", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ usesStoreKit2: true })
    )
    const sk2Items = spec.implementationChecklist.filter(
      (i) => i.category === "StoreKit 2"
    )
    expect(sk2Items.length).toBeGreaterThan(0)
  })

  it("includes StoreKit 2 implementation notes when usesStoreKit2 is true", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ usesStoreKit2: true })
    )
    expect(spec.swiftImplementationNotes.some((n) => n.includes("Product.products"))).toBe(true)
  })

  it("includes legacy StoreKit implementation notes when usesStoreKit2 is false", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ usesStoreKit2: false })
    )
    expect(spec.swiftImplementationNotes.some((n) => n.includes("SKProductsRequest"))).toBe(true)
  })

  it("includes subscription management checklist item when usesSubscriptions is true", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ usesSubscriptions: true })
    )
    const mgmtItem = spec.implementationChecklist.find(
      (i) => i.category === "Subscriptions" && i.task.includes("management")
    )
    expect(mgmtItem).toBeDefined()
  })

  it("includes reviewerSafeDisplayFields with at least 14 fields", () => {
    const spec = generateStoreKitDiagnosticsSpec("app-1", makeInput())
    expect(spec.reviewerSafeDisplayFields.length).toBeGreaterThanOrEqual(14)
  })

  it("githubTask acceptance criteria includes subscription group when usesSubscriptions is true", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({ usesSubscriptions: true })
    )
    expect(
      spec.githubTask.acceptanceCriteria.some((c) => c.includes("subscription group"))
    ).toBe(true)
  })

  it("sets riskLevel to low when no IAP types are used", () => {
    const spec = generateStoreKitDiagnosticsSpec(
      "app-1",
      makeInput({
        usesSubscriptions: false,
        usesConsumables: false,
        usesNonConsumables: false,
      })
    )
    expect(spec.riskLevel).toBe("low")
  })
})

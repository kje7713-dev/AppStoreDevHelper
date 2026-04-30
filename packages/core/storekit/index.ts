import { Checklist, ChecklistItem } from "../../schemas/checklist"
import { randomUUID } from "crypto"
import type {
  StoreKitDiagnosticsInput,
  StoreKitDiagnosticsSpec,
  DiagnosticField,
  ImplementationChecklistItem,
} from "../../schemas/storekit"

export function generateStoreKitChecklist(appId: string): Checklist {
  const items: ChecklistItem[] = [
    { id: randomUUID(), text: "All subscription products configured in App Store Connect", checked: false },
    { id: randomUUID(), text: "Sandbox test accounts created and tested", checked: false },
    { id: randomUUID(), text: "Restore purchases button implemented and functional", checked: false },
    { id: randomUUID(), text: "Subscription management link present (Settings > Subscriptions)", checked: false },
    { id: randomUUID(), text: "Terms of Service and Privacy Policy URLs set in App Store Connect", checked: false },
    { id: randomUUID(), text: "Free trial logic tested (start, expire, convert)", checked: false },
    { id: randomUUID(), text: "Cancellation and expiry handling implemented", checked: false },
    { id: randomUUID(), text: "Introductory offers tested if applicable", checked: false },
    { id: randomUUID(), text: "Receipt validation implemented (server-side or StoreKit 2)", checked: false },
    { id: randomUUID(), text: "Paywall includes required subscription disclosure text", checked: false },
  ]

  return {
    id: randomUUID(),
    appId,
    type: "storeKit",
    items,
    createdAt: new Date().toISOString(),
  }
}

// ── StoreKit Diagnostics Spec Generator ───────────────────────────────────────

const REVIEWER_SAFE_DISPLAY_FIELDS: DiagnosticField[] = [
  {
    field: "requestedProductIds",
    displayLabel: "Requested Product IDs",
    description: "The product ID strings passed to StoreKit for fetching",
  },
  {
    field: "returnedProductCount",
    displayLabel: "Products Returned by StoreKit",
    description: "Number of SKProduct/Product objects returned by StoreKit",
  },
  {
    field: "returnedProductIds",
    displayLabel: "Returned Product IDs",
    description: "Product IDs actually returned by StoreKit (may differ from requested if misconfigured)",
  },
  {
    field: "localizedProductNames",
    displayLabel: "Localized Product Names",
    description: "Display names from StoreKit for each returned product",
  },
  {
    field: "localizedPrices",
    displayLabel: "Localized Prices",
    description: "Formatted price strings including currency symbol for each product",
  },
  {
    field: "subscriptionGroup",
    displayLabel: "Subscription Group",
    description: "Subscription group identifier when available from StoreKit",
  },
  {
    field: "trialIntroOfferDisplayState",
    displayLabel: "Trial / Intro Offer Display State",
    description: "Whether a free trial or introductory offer is currently displayed to the user",
  },
  {
    field: "currentEntitlementState",
    displayLabel: "Current Entitlement State",
    description: "Active subscription or purchase entitlement state (active, expired, none)",
  },
  {
    field: "restorePurchaseResult",
    displayLabel: "Restore Purchase Result",
    description: "Result of the last restore purchases call (success, nothing to restore, error)",
  },
  {
    field: "storeKitEnvironment",
    displayLabel: "StoreKit Environment",
    description: "Detected environment when available: Sandbox, Production, or Xcode StoreKit",
  },
  {
    field: "rawStoreKitErrorMessage",
    displayLabel: "Raw StoreKit Error Message",
    description: "The raw error message from StoreKit when product loading fails",
  },
  {
    field: "lastProductFetchTimestamp",
    displayLabel: "Last Product Fetch Timestamp",
    description: "ISO 8601 timestamp of the most recent successful product fetch",
  },
  {
    field: "appVersionAndBuild",
    displayLabel: "App Version and Build Number",
    description: "CFBundleShortVersionString and CFBundleVersion from the app bundle",
  },
  {
    field: "sandboxReviewerTestingInstructions",
    displayLabel: "Sandbox / Reviewer Testing Instructions",
    description: "Step-by-step instructions for the Apple reviewer to test IAP/subscriptions",
  },
]

function computeRiskLevel(
  input: StoreKitDiagnosticsInput
): "low" | "medium" | "high" {
  const usesIAP =
    input.usesSubscriptions || input.usesConsumables || input.usesNonConsumables

  if (usesIAP && input.productIds.length === 0) return "high"
  if (usesIAP && !input.restorePurchaseImplemented) return "high"
  if (input.previousAppReviewIssue) return "high"
  if (input.knownStoreKitIssue) return "medium"
  if (!input.usesStoreKit2 && !input.hasServerReceiptValidation && usesIAP) return "medium"
  return "low"
}

function buildRequiredDiagnostics(
  input: StoreKitDiagnosticsInput
): DiagnosticField[] {
  const fields: DiagnosticField[] = [
    {
      field: "requestedProductIds",
      displayLabel: "Requested Product IDs",
      description: "Log the exact product ID strings your app passes to StoreKit",
    },
    {
      field: "returnedProductCount",
      displayLabel: "Products Returned by StoreKit",
      description: "Log how many products StoreKit returned — a mismatch signals misconfiguration",
    },
    {
      field: "returnedProductIds",
      displayLabel: "Returned Product IDs",
      description: "Log the product IDs actually returned so reviewers can confirm they match",
    },
    {
      field: "currentEntitlementState",
      displayLabel: "Current Entitlement State",
      description: "Display whether the user has an active entitlement",
    },
    {
      field: "storeKitEnvironment",
      displayLabel: "StoreKit Environment",
      description: "Detect and display whether the app is running in Sandbox or Production",
    },
    {
      field: "lastProductFetchTimestamp",
      displayLabel: "Last Product Fetch Timestamp",
      description: "Record when products were last fetched to help diagnose stale data issues",
    },
    {
      field: "appVersionAndBuild",
      displayLabel: "App Version and Build Number",
      description: "Always show app version and build so reviewers can confirm they have the right build",
    },
  ]

  if (input.usesSubscriptions || input.usesNonConsumables || !input.restorePurchaseImplemented) {
    fields.push({
      field: "restorePurchaseResult",
      displayLabel: "Restore Purchase Result",
      description: "Log the result of restore purchases — required by App Store guidelines",
    })
  }

  if (input.hasFreeTrial || input.hasIntroOffer) {
    fields.push({
      field: "trialIntroOfferDisplayState",
      displayLabel: "Trial / Intro Offer Display State",
      description: "Show whether the trial or intro offer is eligible and currently displayed",
    })
  }

  if (input.usesSubscriptions) {
    fields.push({
      field: "subscriptionGroup",
      displayLabel: "Subscription Group",
      description: "Display the subscription group ID from StoreKit metadata",
    })
  }

  return fields
}

function buildImplementationChecklist(
  input: StoreKitDiagnosticsInput
): ImplementationChecklistItem[] {
  const items: ImplementationChecklistItem[] = []
  const usesIAP =
    input.usesSubscriptions || input.usesConsumables || input.usesNonConsumables

  items.push({
    id: randomUUID(),
    category: "Product Loading",
    task: "Implement a debug panel that displays all reviewer-safe diagnostic fields",
    priority: "required",
    rationale: "Reviewers need to confirm StoreKit is working correctly during review",
  })

  items.push({
    id: randomUUID(),
    category: "Product Loading",
    task: "Log requested vs. returned product IDs and show the count in the debug panel",
    priority: "required",
    rationale: "A mismatch between requested and returned products is a common App Review failure cause",
  })

  items.push({
    id: randomUUID(),
    category: "Product Loading",
    task: "Show raw StoreKit error message in the debug panel when product loading fails",
    priority: "required",
    rationale: "Helps reviewers and developers diagnose configuration problems instantly",
  })

  if (usesIAP) {
    items.push({
      id: randomUUID(),
      category: "Restore Purchases",
      task: "Add a visible Restore Purchases button accessible from the paywall or settings",
      priority: "required",
      rationale: "App Store guidelines require restore purchases to be easily accessible",
    })

    items.push({
      id: randomUUID(),
      category: "Restore Purchases",
      task: "Display restore purchase result (success / nothing to restore / error) in the debug panel",
      priority: "required",
      rationale: "Reviewers must be able to verify restore purchases works in sandbox",
    })

    items.push({
      id: randomUUID(),
      category: "Paywall",
      task: `Confirm paywall is accessible from: ${input.paywallLocation || "app entry point"}`,
      priority: "required",
      rationale: "Reviewers must be able to reach the paywall without additional steps",
    })

    items.push({
      id: randomUUID(),
      category: "Paywall",
      task: "Include required subscription disclosure text on the paywall",
      priority: "required",
      rationale: "Subscription terms must be clearly shown before purchase per App Store guidelines",
    })
  }

  if (input.hasFreeTrial || input.hasIntroOffer) {
    items.push({
      id: randomUUID(),
      category: "Trial / Intro Offer",
      task: "Show trial eligibility status in the debug panel (eligible / ineligible / used)",
      priority: "required",
      rationale: "Reviewers need to confirm the trial state is correctly communicated",
    })

    items.push({
      id: randomUUID(),
      category: "Trial / Intro Offer",
      task: "Test trial flow end-to-end in a sandbox environment using a fresh Apple ID",
      priority: "required",
      rationale: "Intro offer eligibility resets for new sandbox accounts — verify the flow reviewers will see",
    })

    items.push({
      id: randomUUID(),
      category: "Trial / Intro Offer",
      task: "Display intro offer duration and terms clearly in the paywall UI",
      priority: "required",
      rationale: "App Store guidelines require clear disclosure of trial/intro offer terms",
    })
  }

  if (!input.usesStoreKit2) {
    items.push({
      id: randomUUID(),
      category: "Receipt Validation",
      task: "Implement server-side receipt validation or migrate to StoreKit 2 Transaction APIs",
      priority: "recommended",
      rationale: "StoreKit 1 receipts require server-side validation; StoreKit 2 uses on-device verification",
    })
  }

  if (input.usesStoreKit2) {
    items.push({
      id: randomUUID(),
      category: "StoreKit 2",
      task: "Use Transaction.currentEntitlements to verify active entitlements at launch",
      priority: "required",
      rationale: "StoreKit 2 requires checking current entitlements rather than restoring transactions",
    })

    items.push({
      id: randomUUID(),
      category: "StoreKit 2",
      task: "Listen for Transaction.updates to handle background renewals and revocations",
      priority: "required",
      rationale: "StoreKit 2 apps must process transaction updates to stay in sync with the App Store",
    })
  }

  if (input.usesSubscriptions) {
    items.push({
      id: randomUUID(),
      category: "Subscriptions",
      task: "Add subscription management deep link (openURL: itms-apps://...manageSubs or equivalent)",
      priority: "required",
      rationale: "App Store guidelines require apps to provide a way to manage subscriptions",
    })

    items.push({
      id: randomUUID(),
      category: "Subscriptions",
      task: "Handle subscription expiry and renewal states gracefully in the UI",
      priority: "required",
      rationale: "Reviewers may test with expired sandbox subscriptions",
    })
  }

  items.push({
    id: randomUUID(),
    category: "Sandbox Testing",
    task: "Include sandbox/reviewer testing instructions in the debug panel",
    priority: "required",
    rationale: "Reviewers need step-by-step instructions to test IAP in sandbox",
  })

  items.push({
    id: randomUUID(),
    category: "Sandbox Testing",
    task: "Test all purchase flows using a dedicated sandbox Apple ID (not personal)",
    priority: "required",
    rationale: "Personal Apple IDs cannot be used in App Store sandbox",
  })

  if (input.knownStoreKitIssue) {
    items.push({
      id: randomUUID(),
      category: "Known Issue Mitigation",
      task: `Document mitigation plan for known issue: ${input.knownStoreKitIssue}`,
      priority: "required",
      rationale: "Known StoreKit issues must be addressed or documented before submission",
    })
  }

  return items
}

function buildAppReviewNotes(input: StoreKitDiagnosticsInput): string {
  const usesIAP =
    input.usesSubscriptions || input.usesConsumables || input.usesNonConsumables

  const lines: string[] = []

  if (usesIAP) {
    lines.push(
      "This app uses StoreKit for in-app purchases. All purchase flows are testable in the Apple sandbox environment."
    )

    if (input.productIds.length > 0) {
      lines.push(
        `The following product IDs are configured: ${input.productIds.join(", ")}. These products are available for testing in sandbox.`
      )
    }

    if (input.paywallLocation) {
      lines.push(`The paywall can be accessed from: ${input.paywallLocation}.`)
    }

    if (input.restorePurchaseImplemented) {
      lines.push(
        'A "Restore Purchases" button is available. Tapping it will restore any previously purchased products in the sandbox environment.'
      )
    }
  }

  if (input.hasFreeTrial) {
    lines.push(
      "This app offers a free trial period. In sandbox, trial eligibility is granted to new Apple IDs. The trial state is displayed in the reviewer debug panel."
    )
  }

  if (input.hasIntroOffer) {
    lines.push(
      "This app offers an introductory price. The eligibility status is shown in the debug panel within the app."
    )
  }

  if (input.reviewerTestingPath) {
    lines.push(`Reviewer testing path: ${input.reviewerTestingPath}`)
  }

  if (input.previousAppReviewIssue) {
    lines.push(
      `Previous App Review issue noted: "${input.previousAppReviewIssue}". We have addressed this issue by ensuring the relevant StoreKit behavior is now visible in the in-app diagnostics panel. Please refer to the debug panel for confirmation.`
    )
  }

  if (input.knownStoreKitIssue) {
    lines.push(
      `Known StoreKit behavior to be aware of: ${input.knownStoreKitIssue}. This is documented and a mitigation is in place.`
    )
  }

  lines.push(
    "Note: This app includes a reviewer-safe diagnostics panel that shows StoreKit product loading status, entitlement state, and environment. This panel is intended to aid the review process and does not expose any sensitive user data."
  )

  return lines.join("\n\n")
}

function buildSwiftImplementationNotes(
  input: StoreKitDiagnosticsInput
): string[] {
  const notes: string[] = []

  if (input.usesStoreKit2) {
    notes.push(
      "Use `Product.products(for:)` to fetch products and log requested vs. returned IDs."
    )
    notes.push(
      "Check `Transaction.currentEntitlements` at launch to restore access without a network call."
    )
    notes.push(
      "Observe `Transaction.updates` in a Task to handle renewals and revocations in real time."
    )
    if (input.hasFreeTrial || input.hasIntroOffer) {
      notes.push(
        "Use `product.subscription?.introductoryOffer` and `product.subscription?.isEligibleForIntroOffer` to determine trial eligibility (requires iOS 17+; use `product.subscription?.introductoryOffer` alone for eligibility display on earlier versions)."
      )
    }
  } else {
    notes.push(
      "Use `SKProductsRequest` to fetch products and compare `validProducts` vs. `invalidProductIdentifiers` in the response."
    )
    notes.push(
      "Implement `SKPaymentTransactionObserver` and handle `.restored` and `.failed` cases for restore purchases."
    )
    if (input.hasServerReceiptValidation) {
      notes.push(
        "Validate the receipt from `Bundle.main.appStoreReceiptURL` against your server or Apple's verifyReceipt endpoint."
      )
    }
  }

  notes.push(
    "Store diagnostic state in a lightweight observable object and expose it via a developer-facing debug panel (e.g., shake gesture or Settings bundle toggle)."
  )

  notes.push(
    "Use `Bundle.main.infoDictionary` to read `CFBundleShortVersionString` and `CFBundleVersion` for the app version display."
  )

  if (input.usesSubscriptions) {
    notes.push(
      "Add a Settings bundle entry or in-app button that deep-links to subscription management: `UIApplication.shared.open(URL(string: \"itms-apps://apps.apple.com/account/subscriptions\")!)`."
    )
  }

  return notes
}

export function generateStoreKitDiagnosticsSpec(
  appId: string,
  input: StoreKitDiagnosticsInput
): StoreKitDiagnosticsSpec {
  const usesIAP =
    input.usesSubscriptions || input.usesConsumables || input.usesNonConsumables
  const riskLevel = computeRiskLevel(input)

  const riskSummaryMap: Record<string, string> = {
    low: "StoreKit configuration appears low-risk. Implement the diagnostics panel and verify sandbox testing.",
    medium:
      "Moderate StoreKit risk detected. Address the flagged items before App Review submission.",
    high: "High App Review risk detected. Critical StoreKit issues must be resolved before submission.",
  }

  const productSummary =
    input.productIds.length > 0
      ? `${input.productIds.length} product ID(s) configured.`
      : usesIAP
        ? "No product IDs provided — this is a critical misconfiguration risk."
        : "No IAP products configured."

  const summary = `${riskSummaryMap[riskLevel]} ${productSummary}`

  const githubTask = {
    title: "Implement StoreKit Diagnostics Debug Panel for App Review",
    priority: riskLevel,
    summary:
      "Add a reviewer-safe in-app diagnostics panel that displays StoreKit product loading status, entitlement state, restore purchase result, and sandbox environment info to help Apple reviewers verify IAP behavior.",
    acceptanceCriteria: [
      "Debug panel shows requested and returned product IDs",
      "Debug panel shows number of products returned by StoreKit",
      "Debug panel shows localized product names and prices",
      ...(input.usesSubscriptions ? ["Debug panel shows subscription group identifier"] : []),
      ...(input.hasFreeTrial || input.hasIntroOffer
        ? ["Debug panel shows trial/intro offer eligibility state"]
        : []),
      "Debug panel shows current entitlement state",
      "Debug panel shows restore purchase result",
      "Debug panel shows detected StoreKit environment (Sandbox/Production)",
      "Debug panel shows raw StoreKit error message when product loading fails",
      "Debug panel shows timestamp of last product fetch",
      "Debug panel shows app version and build number",
      "Debug panel includes sandbox/reviewer testing instructions",
      "All purchase flows verified in sandbox before submission",
    ],
    labels: ["storekit", "app-review", "iap", riskLevel],
  }

  return {
    id: randomUUID(),
    appId,
    summary,
    riskLevel,
    requiredDiagnostics: buildRequiredDiagnostics(input),
    reviewerSafeDisplayFields: REVIEWER_SAFE_DISPLAY_FIELDS,
    implementationChecklist: buildImplementationChecklist(input),
    appReviewNotes: buildAppReviewNotes(input),
    githubTask,
    swiftImplementationNotes: buildSwiftImplementationNotes(input),
    createdAt: new Date().toISOString(),
  }
}

import { randomUUID } from "crypto"
import type {
  AppReviewInput,
  AppReviewIssueType,
  AppReviewRiskLevel,
  AppReviewResponse,
} from "../../schemas/app-review"
import type { GithubTask } from "../../schemas/task"

// ── Issue type detection ──────────────────────────────────────────────────────

export function detectIssueType(rejectionText: string): AppReviewIssueType {
  const text = rejectionText.toLowerCase()

  const storeKitKeywords = [
    "in-app purchase",
    "in-app purchases",
    "subscription",
    "storekit",
    "product unavailable",
    "purchase failure",
    "iap",
    "restore purchase",
    "payment",
  ]
  if (storeKitKeywords.some((kw) => text.includes(kw))) return "StoreKit"

  const crashKeywords = [
    "crash",
    "launch failure",
    "unresponsive ui",
    "unresponsive",
    "failed to launch",
    "app crashed",
    "force quit",
  ]
  if (crashKeywords.some((kw) => text.includes(kw))) return "Crash"

  const performanceKeywords = [
    "slow",
    "performance",
    "hang",
    "freeze",
    "loading time",
    "battery drain",
    "memory",
  ]
  if (performanceKeywords.some((kw) => text.includes(kw))) return "Performance"

  const loginKeywords = [
    "login",
    "demo account",
    "credentials",
    "sign-in",
    "sign in",
    "username",
    "password",
    "log in",
    "authentication",
  ]
  if (loginKeywords.some((kw) => text.includes(kw))) return "Login"

  const privacyKeywords = [
    "privacy policy",
    "tracking",
    "data collection",
    "permissions",
    "personal data",
    "app tracking transparency",
    "att",
    "idfa",
    "location",
    "microphone",
    "camera",
  ]
  if (privacyKeywords.some((kw) => text.includes(kw))) return "Privacy"

  const metadataKeywords = [
    "metadata",
    "screenshot",
    "app name",
    "description",
    "keywords",
    "subtitle",
    "icon",
    "misleading",
    "inaccurate",
  ]
  if (metadataKeywords.some((kw) => text.includes(kw))) return "Metadata"

  const guidelineKeywords = [
    "guideline",
    "review guideline",
    "rule",
    "policy",
    "violation",
    "comply",
    "compliance",
    "4.",
    "5.",
    "3.",
    "2.",
    "1.",
  ]
  if (guidelineKeywords.some((kw) => text.includes(kw))) return "Guideline"

  return "Other"
}

// ── Risk level ────────────────────────────────────────────────────────────────

export function computeRiskLevel(
  issueType: AppReviewIssueType,
  input: AppReviewInput
): AppReviewRiskLevel {
  if (issueType === "Crash" || issueType === "StoreKit") return "high"
  if (!input.stepsAlreadyTaken || input.stepsAlreadyTaken.trim().length === 0) {
    return "high"
  }
  if (issueType === "Privacy" || issueType === "Login") return "medium"
  return "low"
}

// ── Tone helpers ──────────────────────────────────────────────────────────────

function toneOpening(tone: AppReviewInput["desiredTone"]): string {
  switch (tone) {
    case "concise":
      return "Thank you for reviewing our app."
    case "technical":
      return "Thank you for your detailed feedback regarding our submission."
    case "firm":
      return "Thank you for the review feedback."
    default:
      return "Thank you for taking the time to review our app and for providing this feedback."
  }
}

// ── App Review Response ───────────────────────────────────────────────────────

export function buildAppReviewResponse(
  input: AppReviewInput,
  issueType: AppReviewIssueType
): string {
  const { desiredTone, stepsAlreadyTaken, guideline, demoAccount, knownContext } = input
  const lines: string[] = []

  lines.push(toneOpening(desiredTone))
  lines.push("")

  if (guideline) {
    lines.push(`We understand that our submission did not meet ${guideline} of the App Store Review Guidelines, and we take this seriously.`)
  } else {
    lines.push("We understand the concern raised in the rejection and take this feedback seriously.")
  }
  lines.push("")

  if (knownContext) {
    lines.push(knownContext)
    lines.push("")
  }

  if (stepsAlreadyTaken && stepsAlreadyTaken.trim().length > 0) {
    if (desiredTone === "concise") {
      lines.push(`To address this, we have: ${stepsAlreadyTaken}`)
    } else {
      lines.push("To address the issue raised, we have taken the following steps:")
      lines.push("")
      lines.push(stepsAlreadyTaken)
    }
    lines.push("")
  } else {
    lines.push("We are actively investigating the issue and will make the necessary changes before resubmitting.")
    lines.push("")
  }

  // Issue-type specific context
  if (issueType === "StoreKit") {
    lines.push("All in-app purchase and subscription flows are testable in the Apple sandbox environment. Products are correctly configured in App Store Connect and are available for purchase using a sandbox Apple ID.")
    lines.push("")
  } else if (issueType === "Crash") {
    lines.push("We have been unable to reproduce this crash in our testing environment. We would appreciate any additional details, such as the specific device, OS version, or steps that triggered the issue, so we can investigate further.")
    lines.push("")
  } else if (issueType === "Login") {
    lines.push("We have ensured that valid demo credentials are included in the reviewer notes. The demo account has full access to all app features without requiring any personal information.")
    lines.push("")
  } else if (issueType === "Privacy") {
    lines.push("We have reviewed our privacy policy and data collection practices to ensure full compliance with the App Store guidelines and applicable privacy regulations.")
    lines.push("")
  }

  if (demoAccount) {
    lines.push(`Demo account for testing: ${demoAccount}`)
    lines.push("")
  }

  lines.push("We appreciate your thorough review process and are committed to delivering a high-quality experience that meets all App Store guidelines. Please do not hesitate to reach out if any additional information would be helpful.")

  return lines.join("\n")
}

// ── Reviewer Testing Instructions ────────────────────────────────────────────

export function buildReviewerTestingInstructions(
  input: AppReviewInput,
  issueType: AppReviewIssueType
): string {
  const { testingInstructions, demoAccount, deviceInfo, buildNumber, appVersion } = input
  const lines: string[] = []

  if (buildNumber || appVersion) {
    const versionParts: string[] = []
    if (appVersion) versionParts.push(`Version: ${appVersion}`)
    if (buildNumber) versionParts.push(`Build: ${buildNumber}`)
    lines.push(versionParts.join(" | "))
    lines.push("")
  }

  if (deviceInfo) {
    lines.push(`Test environment: ${deviceInfo}`)
    lines.push("")
  }

  if (demoAccount) {
    lines.push(`Demo account: ${demoAccount}`)
    lines.push("")
  }

  if (testingInstructions && testingInstructions.trim().length > 0) {
    lines.push("Steps to reproduce / verify the fix:")
    lines.push("")
    lines.push(testingInstructions)
    lines.push("")
  } else {
    lines.push("Steps to reproduce / verify:")
    lines.push("")

    if (issueType === "StoreKit") {
      lines.push("1. Launch the app using a sandbox Apple ID.")
      lines.push("2. Navigate to the paywall (see notes for location).")
      lines.push("3. Select any subscription tier and complete the sandbox purchase.")
      lines.push("4. Verify entitlement is granted and premium features are unlocked.")
      lines.push("5. Tap 'Restore Purchases' and verify it restores the purchase correctly.")
    } else if (issueType === "Crash") {
      lines.push("1. Install the latest build.")
      lines.push("2. Launch the app.")
      lines.push("3. Navigate through the main app flows.")
      lines.push("4. If the crash is reproducible on a specific device or iOS version, please share those details so we can investigate further.")
    } else if (issueType === "Login") {
      lines.push("1. Launch the app.")
      lines.push("2. Use the demo credentials provided above to log in.")
      lines.push("3. All app features are accessible after login.")
      lines.push("4. No account creation or personal information is required.")
    } else {
      lines.push("1. Launch the app.")
      lines.push("2. Navigate to the relevant section.")
      lines.push("3. Verify the behavior described in this response.")
    }
    lines.push("")
  }

  return lines.join("\n").trim()
}

// ── Resubmission Notes ────────────────────────────────────────────────────────

export function buildResubmissionNotes(
  input: AppReviewInput,
  issueType: AppReviewIssueType
): string {
  const { stepsAlreadyTaken, guideline } = input
  const lines: string[] = []

  lines.push("## Resubmission Checklist")
  lines.push("")

  if (guideline) {
    lines.push(`- [ ] Confirm fix addresses ${guideline}`)
  }

  if (stepsAlreadyTaken && stepsAlreadyTaken.trim().length > 0) {
    lines.push("- [ ] Verify all stated fixes are implemented and tested")
  }

  if (issueType === "StoreKit") {
    lines.push("- [ ] Test all purchase flows in sandbox before resubmitting")
    lines.push("- [ ] Confirm product IDs are active in App Store Connect")
    lines.push("- [ ] Verify restore purchases works in sandbox")
  } else if (issueType === "Crash") {
    lines.push("- [ ] Reproduce crash in a test environment if possible")
    lines.push("- [ ] Add crash reporting or logging to capture the failure")
    lines.push("- [ ] Test on multiple device types and iOS versions")
  } else if (issueType === "Login") {
    lines.push("- [ ] Include valid demo credentials in App Review notes")
    lines.push("- [ ] Ensure demo account is accessible without additional setup")
  } else if (issueType === "Privacy") {
    lines.push("- [ ] Review all permission usage strings for clarity and accuracy")
    lines.push("- [ ] Update privacy policy URL in App Store Connect if needed")
    lines.push("- [ ] Ensure App Tracking Transparency prompt is implemented if applicable")
  } else if (issueType === "Metadata") {
    lines.push("- [ ] Review all screenshots for accuracy against current app version")
    lines.push("- [ ] Confirm app name, description, and subtitle are non-misleading")
  }

  lines.push("- [ ] Complete a full test run on a real device before submission")
  lines.push("- [ ] Update App Review notes with testing instructions and demo credentials")

  return lines.join("\n")
}

// ── Internal Tasks ────────────────────────────────────────────────────────────

export function buildInternalTasks(
  input: AppReviewInput,
  issueType: AppReviewIssueType,
  riskLevel: AppReviewRiskLevel
): GithubTask[] {
  const tasks: GithubTask[] = []
  const { guideline, stepsAlreadyTaken } = input

  const guidelineLabel = guideline ? guideline.replace(/\s+/g, "-").toLowerCase() : "app-review"

  // Primary fix task
  tasks.push({
    title: `[AppReview] Fix ${issueType} rejection${guideline ? ` (${guideline})` : ""}`,
    priority: riskLevel,
    summary: `Address the App Review rejection${guideline ? ` for ${guideline}` : ""}: ${issueType} issue detected. ${
      stepsAlreadyTaken
        ? "Steps already taken: " + stepsAlreadyTaken
        : "Investigation required to identify root cause."
    }`,
    acceptanceCriteria: buildFixAcceptanceCriteria(issueType, input),
    labels: ["app-review", issueType.toLowerCase(), riskLevel, guidelineLabel].filter(
      (v, i, arr) => arr.indexOf(v) === i
    ),
  })

  // Reviewer notes task (always include)
  tasks.push({
    title: "[AppReview] Update reviewer notes and testing instructions",
    priority: "medium",
    summary:
      "Ensure App Review notes include clear testing instructions, demo credentials, and a description of the fix.",
    acceptanceCriteria: [
      "Reviewer notes include step-by-step testing instructions",
      "Demo account credentials are valid and included",
      "Notes describe what was changed and how to verify the fix",
    ],
    labels: ["app-review", "documentation"],
  })

  // Issue-type specific follow-up tasks
  if (issueType === "StoreKit") {
    tasks.push({
      title: "[StoreKit] Verify all purchase flows before resubmission",
      priority: "high",
      summary:
        "Run end-to-end sandbox purchase tests for all active product IDs before resubmitting.",
      acceptanceCriteria: [
        "All products load successfully in sandbox",
        "Purchase flow completes without error",
        "Restore Purchases works for previously purchased products",
        "Entitlement is correctly granted after purchase",
      ],
      labels: ["storekit", "app-review", "testing"],
    })
  } else if (issueType === "Crash") {
    tasks.push({
      title: "[Stability] Investigate and fix crash reported in App Review",
      priority: "high",
      summary:
        "Investigate the crash or launch failure reported by the App Review team. Add crash logging if not already in place.",
      acceptanceCriteria: [
        "Crash is reproducible in a test environment or root cause is identified",
        "Fix is implemented and verified on a real device",
        "Crash reporting is in place to catch future regressions",
      ],
      labels: ["bug", "crash", "app-review", "high"],
    })
  } else if (issueType === "Privacy") {
    tasks.push({
      title: "[Privacy] Audit permission usage and privacy policy",
      priority: "medium",
      summary:
        "Audit all permission usage strings, App Tracking Transparency (ATT) implementation, and privacy policy to ensure compliance.",
      acceptanceCriteria: [
        "All permission usage strings accurately describe why each permission is needed",
        "ATT prompt is displayed before any tracking occurs (if applicable)",
        "Privacy policy URL is live and up-to-date in App Store Connect",
      ],
      labels: ["privacy", "compliance", "app-review"],
    })
  }

  return tasks
}

function buildFixAcceptanceCriteria(
  issueType: AppReviewIssueType,
  input: AppReviewInput
): string[] {
  const criteria: string[] = []

  switch (issueType) {
    case "StoreKit":
      criteria.push("Products load correctly in sandbox environment")
      criteria.push("Purchase flow completes without error")
      criteria.push("Restore Purchases works as expected")
      break
    case "Crash":
      criteria.push("App launches without crashing on supported devices and OS versions")
      criteria.push("The specific crash scenario from the rejection no longer reproduces")
      break
    case "Login":
      criteria.push("Demo credentials are included and work without additional setup")
      criteria.push("All app features are accessible after login with demo account")
      break
    case "Privacy":
      criteria.push("Permission usage descriptions accurately reflect app behavior")
      criteria.push("ATT prompt is displayed correctly where required")
      criteria.push("Privacy policy is live and accessible")
      break
    case "Metadata":
      criteria.push("Screenshots accurately reflect the current app experience")
      criteria.push("App name, subtitle, and description are accurate and non-misleading")
      break
    case "Performance":
      criteria.push("App responds within acceptable time on supported devices")
      criteria.push("No UI hangs or freezes during normal usage")
      break
    default:
      criteria.push("The issue described in the rejection is fully resolved")
      criteria.push("Verified on a real device before resubmission")
  }

  if (input.guideline) {
    criteria.push(`Submission complies with ${input.guideline}`)
  }

  return criteria
}

// ── Missing Info ──────────────────────────────────────────────────────────────

export function collectMissingInfo(input: AppReviewInput): string[] {
  const missing: string[] = []

  if (!input.stepsAlreadyTaken || input.stepsAlreadyTaken.trim().length === 0) {
    missing.push(
      "What changes were made before resubmission? (stepsAlreadyTaken) — Without this, the response cannot confirm a fix was implemented."
    )
  }

  if (!input.testingInstructions || input.testingInstructions.trim().length === 0) {
    missing.push(
      "What are the exact steps a reviewer should follow to test the fix? (testingInstructions) — Providing a clear testing path increases the chance of approval."
    )
  }

  if (!input.demoAccount) {
    missing.push(
      "Is a demo account required? If so, provide credentials. (demoAccount) — Many rejections stem from reviewers being unable to access the app."
    )
  }

  return missing
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function generateAppReviewResponse(
  appId: string,
  input: AppReviewInput
): AppReviewResponse {
  const issueType = detectIssueType(input.rejectionText)
  const riskLevel = computeRiskLevel(issueType, input)
  const missingInfo = collectMissingInfo(input)

  const appReviewResponse = buildAppReviewResponse(input, issueType)
  const reviewerTestingInstructions = buildReviewerTestingInstructions(input, issueType)
  const resubmissionNotes = buildResubmissionNotes(input, issueType)
  const internalTasks = buildInternalTasks(input, issueType, riskLevel)

  const summary = `${issueType} rejection detected. Risk level: ${riskLevel}.${
    missingInfo.length > 0
      ? ` ${missingInfo.length} piece(s) of additional context would strengthen this response.`
      : " Response is ready for submission."
  }`

  return {
    id: randomUUID(),
    appId,
    summary,
    detectedIssueType: issueType,
    riskLevel,
    appReviewResponse,
    reviewerTestingInstructions,
    resubmissionNotes,
    internalTasks,
    missingInfo,
    createdAt: new Date().toISOString(),
  }
}

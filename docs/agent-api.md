# Agent API Guide

This document explains how an automated agent or script can operate AppOps Agent without using the browser UI.

> **Warning:** Authentication and API keys are not implemented yet. All endpoints are open. Do not expose this server publicly with sensitive data.

---

## Base URL

```
http://localhost:3000
```

Set `BASE_URL` in your agent to the actual deployment URL if running remotely.

---

## Endpoints

### List all app profiles

```
GET /api/apps
```

**Response:** Array of `AppProfile` objects.

```json
[
  {
    "id": "uuid",
    "name": "My App",
    "platform": "ios",
    "bundleId": "com.example.myapp",
    "businessModel": "subscription",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### Create an app profile

```
POST /api/apps
Content-Type: application/json
```

**Request body:**

```json
{
  "name": "My App",
  "platform": "ios",
  "bundleId": "com.example.myapp",
  "appStoreUrl": "https://apps.apple.com/app/my-app/id123456789",
  "category": "Productivity",
  "targetAudience": "Indie developers",
  "businessModel": "subscription",
  "currentMetadata": {
    "subtitle": "Build faster",
    "description": "A great app for developers.",
    "keywords": "developer,tools,productivity",
    "promotionalText": "Try free for 7 days!"
  }
}
```

**Required fields:** `name`, `platform` (must be `"ios"`).

**Response:** Created `AppProfile` with status `201`.

---

### Get a single app profile

```
GET /api/apps/:appId
```

**Response:** `AppProfile` or `404`.

---

### Update an app profile

```
PATCH /api/apps/:appId
Content-Type: application/json
```

**Request body:** Any subset of `AppProfile` fields (all optional).

**Response:** Updated `AppProfile`.

---

### Run a release audit

```
POST /api/apps/:appId/release/audit
Content-Type: application/json
```

> **Requires `OPENAI_API_KEY`** in the server environment.

**Request body:**

```json
{
  "latestChanges": "Added dark mode, fixed crash on iOS 17, updated subscription flow.",
  "knownIssues": "Keyboard occasionally overlaps text field on iPad.",
  "testFlightNotes": "Please test dark mode toggle in Settings.",
  "reviewerNotes": "Use demo@example.com / Demo1234 to log in. Tap Settings → Upgrade to reach the paywall.",
  "previousRejectionText": "Your app was rejected for guideline 3.1.1..."
}
```

**Required fields:** `latestChanges`.

**Response:** `ReleaseAudit` object:

```json
{
  "id": "uuid",
  "appId": "uuid",
  "releaseRiskScore": 42,
  "summary": "Medium-risk release. One high-severity issue found.",
  "blockingIssues": [
    {
      "area": "StoreKit",
      "severity": "high",
      "issue": "Paywall may not surface restore button clearly.",
      "recommendedFix": "Add a visible Restore Purchases button on the paywall screen."
    }
  ],
  "checklists": {
    "testFlight": ["Verify dark mode on iPhone 14 Pro", "Test on iOS 16"],
    "appReview": ["Include demo account credentials in reviewer notes"],
    "storeKit": ["Restore Purchases button visible on paywall"]
  },
  "githubTasks": [
    {
      "title": "Add Restore Purchases button to paywall",
      "priority": "high",
      "summary": "App Review requires a visible restore button.",
      "acceptanceCriteria": ["Button is visible without scrolling", "Tapping it restores active subscriptions"],
      "labels": ["storekit", "app-review"]
    }
  ],
  "createdAt": "2025-06-01T12:00:00.000Z"
}
```

---

### List saved audits for an app

```
GET /api/apps/:appId/audits
```

**Response:** Array of `ReleaseAudit` objects, sorted newest first.

---

### Get a specific audit by ID

```
GET /api/audits/:auditId
```

**Response:** `ReleaseAudit` or `404`.

---

### Generate App Review response

```
POST /api/apps/:appId/app-review/response
Content-Type: application/json
```

**Request body:**

```json
{
  "rejectionText": "We noticed that your app includes in-app purchases, but the products were unavailable during our review.",
  "guideline": "Guideline 3.1.1 – In-App Purchase",
  "buildNumber": "142",
  "appVersion": "2.1.0",
  "deviceInfo": "iPhone 15 Pro, iOS 17.4",
  "reviewerIssueSummary": "Reviewer could not load IAP products",
  "stepsAlreadyTaken": "Confirmed product IDs are active in App Store Connect. Added a debug panel showing StoreKit status.",
  "testingInstructions": "1. Launch the app. 2. Tap Upgrade on the home screen. 3. Select Monthly plan. 4. Complete purchase in sandbox.",
  "demoAccount": "demo@example.com / Demo1234",
  "knownContext": "Products are only available after the user completes onboarding.",
  "desiredTone": "professional"
}
```

**Required fields:** `rejectionText`.

**Optional fields:** `guideline`, `buildNumber`, `appVersion`, `deviceInfo`, `reviewerIssueSummary`, `stepsAlreadyTaken`, `testingInstructions`, `demoAccount`, `knownContext`, `desiredTone` (defaults to `"professional"`).

**`desiredTone` values:** `"professional"` | `"concise"` | `"technical"` | `"firm"`

**Response:** `AppReviewResponse` object:

```json
{
  "id": "uuid",
  "appId": "uuid",
  "summary": "StoreKit rejection detected. Risk level: high. Response is ready for submission.",
  "detectedIssueType": "StoreKit",
  "riskLevel": "high",
  "appReviewResponse": "Thank you for taking the time to review our app...",
  "reviewerTestingInstructions": "Version: 2.1.0 | Build: 142\n\n1. Launch the app using a sandbox Apple ID...",
  "resubmissionNotes": "## Resubmission Checklist\n\n- [ ] Confirm fix addresses Guideline 3.1.1...",
  "internalTasks": [
    {
      "title": "[AppReview] Fix StoreKit rejection (Guideline 3.1.1 – In-App Purchase)",
      "priority": "high",
      "summary": "Address the App Review rejection...",
      "acceptanceCriteria": [
        "Products load correctly in sandbox environment",
        "Purchase flow completes without error"
      ],
      "labels": ["app-review", "storekit", "high"]
    }
  ],
  "missingInfo": [],
  "createdAt": "2025-06-01T12:00:00.000Z"
}
```

**`detectedIssueType` values:** `StoreKit` | `Metadata` | `Crash` | `Login` | `Privacy` | `Guideline` | `Performance` | `Other`

**`riskLevel` values:** `low` | `medium` | `high`

**Important behavior:**
- If `rejectionText` is missing, returns `400`.
- If `stepsAlreadyTaken` is empty, `missingInfo` will include a prompt asking what changed before resubmission.
- If `testingInstructions` is empty, `missingInfo` will include a prompt asking for the reviewer testing path.
- The response never sounds hostile toward Apple.
- The response will not claim a fix was made unless `stepsAlreadyTaken` is provided.

---

### Generate StoreKit diagnostics spec

```
POST /api/apps/:appId/storekit/diagnostics-spec
Content-Type: application/json
```

> **Requires `OPENAI_API_KEY`** in the server environment.

**Request body:**

```json
{
  "productIds": ["com.example.app.monthly", "com.example.app.annual"],
  "usesSubscriptions": true,
  "usesConsumables": false,
  "usesNonConsumables": false,
  "hasFreeTrial": true,
  "hasIntroOffer": false,
  "restorePurchaseImplemented": true,
  "paywallLocation": "Tap the lock icon on the home screen, or Settings → Upgrade",
  "reviewerTestingPath": "1. Open app. 2. Tap lock icon. 3. Select Monthly plan. 4. Complete purchase in sandbox.",
  "knownStoreKitIssue": "None",
  "previousAppReviewIssue": "",
  "usesStoreKit2": true,
  "hasServerReceiptValidation": false
}
```

**Required fields:** `paywallLocation`.

**Response:** `StoreKitDiagnosticsSpec` object containing:
- `summary` — plain-English risk summary
- `riskLevel` — `"low" | "medium" | "high"`
- `requiredDiagnostics` — fields that must appear in reviewer-safe debug panel
- `reviewerSafeDisplayFields` — all suggested debug panel fields
- `implementationChecklist` — categorized checklist items with priority
- `appReviewNotes` — suggested text for App Review notes field
- `githubTask` — structured GitHub task with acceptance criteria
- `swiftImplementationNotes` — Swift-specific guidance

---

### Generate ASO metadata

```
POST /api/apps/:appId/aso/generate
Content-Type: application/json
```

**Request body:**

```json
{
  "appName": "Focusly",
  "category": "Productivity",
  "targetAudience": "Indie developers",
  "primaryBenefit": "Ship faster with fewer App Review rejections",
  "differentiators": ["Offline-first", "No account required", "Privacy focused"],
  "competitorApps": ["Notion", "Trello"],
  "currentSubtitle": "Dev toolkit",
  "currentKeywords": "ios,dev,tools,swift",
  "currentPromotionalText": "Try free for 7 days!",
  "currentDescription": "A great app for developers.",
  "tone": "professional",
  "includeNegativeKeywords": true,
  "localization": "none"
}
```

**Required fields:** none — all fields are optional. If `appName` is omitted, the app profile name is used.

**Optional fields:** all fields above.

**`tone` values:** `"professional"` | `"direct"` | `"bold"` | `"minimal"`

**`localization` values:** `"none"` | `"starter"`

**Response:** `AsoOutput` object:

```json
{
  "id": "uuid",
  "appId": "uuid",
  "summary": "Generated ASO metadata for \"Focusly\". 3 subtitle option(s), 2 description option(s).",
  "subtitleOptions": [
    { "text": "Productivity for devs", "charCount": 21 }
  ],
  "promotionalTextOptions": [
    { "text": "Focusly helps indie developers ship faster with fewer rejections.", "charCount": 65 }
  ],
  "keywordFieldOptions": [
    { "text": "ios,dev,tools,swift,productivity", "charCount": 31, "keywords": ["ios", "dev", "tools", "swift", "productivity"] }
  ],
  "descriptionOptions": [
    { "name": "Short", "text": "Focusly is a productivity app built for indie developers...", "charCount": 312 },
    { "name": "Full", "text": "Focusly is a productivity app designed to help indie developers...", "charCount": 487 }
  ],
  "releaseNotesOptions": [
    { "text": "Bug fixes and performance improvements.", "charCount": 38 },
    { "text": "WHAT'S NEW\n\n• Performance improvements...", "charCount": 120 }
  ],
  "warnings": [],
  "negativeKeywords": ["free", "best", "#1", "top", "cheap"],
  "githubTask": {
    "title": "[ASO] Update App Store metadata for Focusly",
    "priority": "medium",
    "summary": "Apply generated ASO metadata to App Store Connect...",
    "acceptanceCriteria": [
      "Subtitle is updated in App Store Connect (max 30 chars)",
      "Promotional text is updated (max 170 chars)"
    ],
    "labels": ["aso", "app-store", "metadata"]
  },
  "createdAt": "2025-06-01T12:00:00.000Z"
}
```

**Strict character limits enforced:**
- `subtitleOptions[].text` — max 30 characters
- `promotionalTextOptions[].text` — max 170 characters
- `keywordFieldOptions[].text` — max 100 characters (comma-separated)
- `descriptionOptions[].text` — max 4000 characters
- `releaseNotesOptions[].text` — max 4000 characters

**Important behavior:**
- No generated field will exceed Apple's character limits.
- `charCount` is included on every generated text option.
- If generated text is near a limit (≥90%), a warning is added to `warnings`.
- If `appName` is omitted, the app profile's name is used.
- If current metadata fields are present on the app profile, they are used as context.
- Keyword field is comma-separated with no spaces after commas.
- If `includeNegativeKeywords` is `true`, `negativeKeywords` contains terms to avoid.
- No competitor scraping, no external API calls, no Apple Search Ads integration.

---

### Generate GitHub task bundle

```
POST /api/apps/:appId/tasks/bundle
Content-Type: application/json
```

Collects GitHub-ready tasks from release audits, StoreKit diagnostics, App Review responses, and ASO metadata into a single structured bundle. Uses the latest saved output for each source unless a specific ID is provided.

**Request body:**

```json
{
  "includeReleaseAuditTasks": true,
  "includeStoreKitTasks": true,
  "includeAppReviewTasks": true,
  "includeAsoTasks": true,
  "releaseAuditId": "optional-uuid",
  "storeKitSpecId": "optional-uuid",
  "appReviewResponseId": "optional-uuid",
  "asoOutputId": "optional-uuid",
  "priorityFloor": "medium",
  "labelPrefix": "appops",
  "agentMode": false
}
```

**All `include*` booleans default to `true`. All other fields are optional.**

| Field | Type | Description |
|---|---|---|
| `includeReleaseAuditTasks` | boolean | Include tasks from the latest release audit |
| `includeStoreKitTasks` | boolean | Include task from the latest StoreKit diagnostics spec |
| `includeAppReviewTasks` | boolean | Include tasks from the latest App Review response |
| `includeAsoTasks` | boolean | Include task from the latest ASO metadata output |
| `releaseAuditId` | string (optional) | Use a specific release audit by ID |
| `storeKitSpecId` | string (optional) | Use a specific StoreKit spec by ID |
| `appReviewResponseId` | string (optional) | Use a specific App Review response by ID |
| `asoOutputId` | string (optional) | Use a specific ASO output by ID |
| `priorityFloor` | `"low"` \| `"medium"` \| `"high"` (optional) | Exclude tasks below this priority |
| `labelPrefix` | string (optional) | Prefix all task labels, e.g. `"appops"` → `"appops/storekit"` |
| `agentMode` | boolean (optional) | Reserved for future agent-specific behaviour |

**Response:** `TaskBundle` object:

```json
{
  "id": "uuid",
  "appId": "uuid",
  "summary": "5 task(s) from release-audit, storekit, app-review, aso.",
  "taskCount": 5,
  "tasks": [
    {
      "title": "[AppReview] Add reviewer notes",
      "priority": "high",
      "source": "release-audit",
      "summary": "Include demo account in App Review notes.",
      "acceptanceCriteria": [
        "Reviewer notes include demo credentials",
        "Notes describe all features"
      ],
      "labels": ["app-review", "high"],
      "markdown": "## [AppReview] Add reviewer notes\n\n**Priority:** high  **Source:** release-audit\n\n..."
    }
  ],
  "bundleMarkdown": "# GitHub Task Bundle\n\n...",
  "agentImplementationBrief": "## Agent Implementation Brief\n\n...",
  "createdAt": "2025-06-01T12:00:00.000Z",
  "warnings": []
}
```

**`source` values:** `release-audit` | `storekit` | `app-review` | `aso` | `manual`

**Important behavior:**
- If a source has no saved output, it is skipped and a warning is added to `warnings`.
- Tasks with identical (case-insensitive) titles are deduplicated.
- `tasks[].markdown` is ready to paste directly as a GitHub issue body.
- `bundleMarkdown` is the full bundle as a single markdown document.
- `agentImplementationBrief` is a self-contained prompt for a coding agent.

---

## Recommended Agent Workflow

An agent can complete a full release check cycle and export GitHub issues with these steps:

### Step 1: Create or fetch app profile

```bash
# Create (first time)
curl -X POST "$BASE_URL/api/apps" \
  -H "Content-Type: application/json" \
  -d '{"name": "My App", "platform": "ios", "bundleId": "com.example.myapp"}'

# Or list existing profiles to find the appId
curl "$BASE_URL/api/apps"
```

Save the returned `id` as `APP_ID`.

### Step 2: Run a release audit

```bash
curl -X POST "$BASE_URL/api/apps/$APP_ID/release/audit" \
  -H "Content-Type: application/json" \
  -d '{
    "latestChanges": "Fixed crash on iOS 17, updated paywall copy.",
    "reviewerNotes": "Demo login: demo@example.com / Demo1234"
  }'
```

Save the returned `id` as `AUDIT_ID` and `releaseRiskScore` for triage.

### Step 3: Fetch the saved audit later

```bash
curl "$BASE_URL/api/audits/$AUDIT_ID"
```

Use `blockingIssues` and `githubTasks` to generate work items.

### Step 4: Generate StoreKit diagnostics

```bash
curl -X POST "$BASE_URL/api/apps/$APP_ID/storekit/diagnostics-spec" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["com.example.app.monthly"],
    "usesSubscriptions": true,
    "usesConsumables": false,
    "usesNonConsumables": false,
    "hasFreeTrial": true,
    "hasIntroOffer": false,
    "restorePurchaseImplemented": true,
    "paywallLocation": "Settings → Upgrade",
    "usesStoreKit2": true,
    "hasServerReceiptValidation": false
  }'
```

### Step 5: Generate a GitHub task bundle

Collect tasks from all sources into a single exportable bundle:

```bash
curl -X POST "$BASE_URL/api/apps/$APP_ID/tasks/bundle" \
  -H "Content-Type: application/json" \
  -d '{
    "includeReleaseAuditTasks": true,
    "includeStoreKitTasks": true,
    "includeAppReviewTasks": true,
    "includeAsoTasks": true,
    "priorityFloor": "medium",
    "labelPrefix": "appops"
  }'
```

The response includes `bundleMarkdown` (paste-ready for GitHub) and `agentImplementationBrief` (a single prompt for a coding agent).

---

## Data Storage

All data is persisted to `.data/` files in the project root:

| File | Contents |
|---|---|
| `.data/apps.json` | App profiles |
| `.data/audits.json` | Release audit results |
| `.data/storekit-specs.json` | StoreKit diagnostics specs |
| `.data/app-review-responses.json` | App Review responses |
| `.data/aso-outputs.json` | ASO metadata outputs |

These are plain JSON files. Back them up or replace them with a database before deploying to production.

---

## Not implemented (future PRs)

- Authentication / API keys
- Billing or subscription enforcement
- GitHub OAuth
- Apple App Store Connect API integration
- Multi-user support

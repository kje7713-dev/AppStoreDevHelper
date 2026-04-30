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

## Recommended Agent Workflow

An agent can complete a full release check cycle with these steps:

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

### Step 5: Export GitHub-ready task markdown

Parse `githubTasks` from the audit response. Each task has:

```json
{
  "title": "Add Restore Purchases button",
  "priority": "high",
  "summary": "...",
  "acceptanceCriteria": ["...", "..."],
  "labels": ["storekit"]
}
```

Format these as GitHub issue bodies and POST them to the GitHub Issues API using the label, title, and body fields.

---

## Data Storage

All data is persisted to `.data/apps.json` and `.data/audits.json` in the project root. These are plain JSON files. Back them up or replace them with a database before deploying to production.

---

## Not implemented (future PRs)

- Authentication / API keys
- Billing or subscription enforcement
- GitHub OAuth
- Apple App Store Connect API integration
- Multi-user support

# AppOps Agent

API-first App Store operations assistant for indie iOS developers.

AppOps Agent helps app builders prepare releases, reduce App Review risk, generate App Store metadata, produce TestFlight checklists, create App Review response drafts, and convert messy release problems into structured GitHub-ready tasks.

This is not intended to be another generic ASO tool. The first wedge is release readiness: subscriptions, StoreKit, TestFlight, App Review notes, rejection risk, and operational task generation.

---

## Core Idea

Indie app developers lose time on scattered App Store workflows:

- App Review rejection loops
- StoreKit and subscription testing issues
- TestFlight checklist gaps
- App Store metadata limits
- unclear release notes
- incomplete reviewer notes
- weak ASO copy
- Apple Search Ads confusion
- manual GitHub issue writing
- no repeatable pre-submit process

AppOps Agent turns those workflows into structured outputs through a web UI and API.

---

## Product Position

AppOps Agent is the control plane for AI-assisted mobile app release operations.

It should help a developer answer:

> Is this app ready to submit, and what exact work needs to happen before Apple rejects it?

---

## MVP Scope

The first version should support:

1. App profile creation
2. Release-readiness audit
3. StoreKit and subscription risk checklist
4. TestFlight checklist generation
5. App Review notes generation
6. App Review rejection-response drafting
7. App Store metadata generation
8. ASO keyword-field generation
9. Release notes generation
10. GitHub-ready issue/task generation
11. API access for agents, scripts, and CI workflows

---

## Non-Goals for V1

Do not start with:

- full App Store Connect automation
- full Apple Ads automation
- autonomous budget management
- screenshot generation
- Android support
- automated PR creation
- campaign optimization
- multi-user agency dashboards
- real-time analytics ingestion

Those can come later.

The V1 goal is useful structured output, not fake autonomy.

---

## Target Users

### Primary

- solo iOS developers
- indie app builders
- small app studios
- technical founders shipping subscription apps

### Secondary

- app marketing freelancers
- mobile consultants
- agencies managing small app portfolios

---

## Initial Use Cases

### Release Readiness Audit

Input:

- app name
- bundle ID
- latest changes
- known issues
- subscription model
- App Store metadata
- TestFlight notes
- reviewer notes
- previous rejection text

Output:

- release risk score
- blocking issues
- suggested fixes
- App Review checklist
- TestFlight checklist
- StoreKit diagnostics checklist
- GitHub-ready tasks

---

### StoreKit / Subscription Review Prep

Generate a checklist that helps developers verify:

- requested product IDs
- returned product count
- localized prices
- trial eligibility display
- restore purchase behavior
- sandbox account state
- error logging
- reviewer-visible diagnostics
- fallback messages
- entitlement state

---

### Metadata Generation

Generate:

- 100-character keyword field
- subtitle options
- promotional text under 170 characters
- app description variants
- release notes
- reviewer notes
- localization suggestions

---

### Rejection Response

Input:

- Apple rejection message
- app context
- steps already taken
- build number
- affected device / OS if known

Output:

- professional reply to App Review
- technical explanation
- suggested test instructions
- internal remediation tasks

---

## API-First Design

The API should be usable by:

- the web UI
- GitHub Actions
- CLI tools
- AI agents
- future MCP servers
- external automation systems

The API should return structured JSON, not just loose prose.

### Good Response Shape

```json
{
  "summary": "Release has a high StoreKit review risk.",
  "riskScore": 82,
  "blockingIssues": [],
  "recommendedTasks": [],
  "reviewNotes": {},
  "metadataSuggestions": {},
  "checklists": {}
}
```

### Bad Response Shape

```json
{
  "text": "Here is a long blob of advice..."
}
```

---

## Proposed API Endpoints

```txt
POST /apps
GET /apps
GET /apps/:appId
PATCH /apps/:appId

POST /apps/:appId/release/audit
POST /apps/:appId/release/checklist
POST /apps/:appId/release/notes

POST /apps/:appId/storekit/checklist
POST /apps/:appId/storekit/diagnostics-spec

POST /apps/:appId/app-review/notes
POST /apps/:appId/app-review/response

POST /apps/:appId/aso/audit
POST /apps/:appId/aso/generate

POST /apps/:appId/ads/search-ads-plan

POST /apps/:appId/tasks/github
POST /apps/:appId/tasks/agent-brief
```

---

## Example API Request

```bash
curl -X POST https://api.appopsagent.com/apps/app_123/release/audit \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "SBD Workout Planner",
    "platform": "ios",
    "bundleId": "com.example.sbd",
    "businessModel": "subscription",
    "latestChanges": [
      "Added subscription paywall",
      "Added restore purchase",
      "Updated onboarding"
    ],
    "knownIssues": [
      "Apple reviewer could not load subscription products"
    ],
    "metadata": {
      "subtitle": "Flexible AI Workout Planning",
      "description": "AI workout planner for flexible training.",
      "keywords": "workout planner,gym tracker,bjj training"
    }
  }'
```

---

## Example API Response

```json
{
  "releaseRiskScore": 82,
  "summary": "This release has elevated App Review risk because subscription product loading has previously failed during review.",
  "blockingIssues": [
    {
      "area": "StoreKit",
      "severity": "high",
      "issue": "Subscription products may not be loading reliably for reviewers.",
      "recommendedFix": "Add a reviewer-safe diagnostics panel that shows requested product IDs, returned product count, localized prices, and raw StoreKit errors."
    }
  ],
  "checklists": {
    "testFlight": [
      "Install fresh from TestFlight.",
      "Confirm paywall appears.",
      "Confirm product IDs return from StoreKit.",
      "Confirm trial text displays correctly.",
      "Confirm restore purchase works.",
      "Confirm entitlement unlocks premium state."
    ],
    "appReview": [
      "Include reviewer notes explaining where the paywall is located.",
      "Include sandbox-safe testing path.",
      "Include restore purchase instructions.",
      "Include known troubleshooting steps."
    ]
  },
  "githubTasks": [
    {
      "title": "Add StoreKit diagnostics panel for review builds",
      "priority": "high",
      "acceptanceCriteria": [
        "Show requested product IDs.",
        "Show number of products returned.",
        "Show localized price for returned products.",
        "Show raw StoreKit error when product fetch fails.",
        "Hide diagnostics from normal production users unless enabled."
      ]
    }
  ]
}
```

---

## Suggested Tech Stack

Recommended first build:

```txt
Frontend: Next.js
Backend: Next.js API routes or FastAPI
Database: Postgres / Supabase
Auth: Clerk or Supabase Auth
Queue: Inngest
LLM providers: OpenAI and/or Anthropic
Storage: Cloudflare R2 or S3
Payments: Stripe
Integrations later: GitHub, App Store Connect API, Apple Ads API
```

Keep the stack boring. The product risk is workflow focus, not infrastructure.

---

## Suggested Repo Structure

```txt
appops-agent/
  README.md
  docs/
    product-brief.md
    api-spec.md
    mvp-scope.md
    agent-instructions.md
  apps/
    web/
      app/
      components/
      lib/
      api/
  packages/
    core/
      app-profile/
      release-audit/
      storekit/
      aso/
      tasks/
    schemas/
      app.ts
      release.ts
      checklist.ts
      task.ts
    prompts/
      release-audit.md
      aso-generate.md
      app-review-response.md
  scripts/
  tests/
  .env.example
  package.json
```

---

## Core Data Model

### AppProfile

```ts
type AppProfile = {
  id: string
  name: string
  platform: "ios"
  bundleId?: string
  appStoreUrl?: string
  category?: string
  targetAudience?: string
  businessModel?: "free" | "paid" | "subscription" | "iap" | "freemium"
  currentMetadata?: AppMetadata
  createdAt: string
  updatedAt: string
}
```

### AppMetadata

```ts
type AppMetadata = {
  subtitle?: string
  promotionalText?: string
  description?: string
  keywords?: string
  releaseNotes?: string
}
```

### ReleaseAudit

```ts
type ReleaseAudit = {
  id: string
  appId: string
  releaseRiskScore: number
  summary: string
  blockingIssues: ReleaseIssue[]
  checklists: {
    testFlight: string[]
    appReview: string[]
    storeKit?: string[]
  }
  githubTasks: GithubTask[]
  createdAt: string
}
```

### ReleaseIssue

```ts
type ReleaseIssue = {
  area: "StoreKit" | "AppReview" | "TestFlight" | "Metadata" | "ASO" | "Ads" | "Other"
  severity: "low" | "medium" | "high"
  issue: string
  recommendedFix: string
}
```

### GithubTask

```ts
type GithubTask = {
  title: string
  priority: "low" | "medium" | "high"
  summary: string
  acceptanceCriteria: string[]
  labels?: string[]
}
```

---

## Prompting Principles

Prompts should produce:

- structured JSON
- concise summaries
- explicit risk levels
- concrete next actions
- acceptance criteria
- app-store-specific warnings
- copy that respects character limits

Prompts should avoid:

- generic marketing fluff
- vague advice
- unsupported claims
- unstructured paragraphs when JSON is expected
- pretending integrations exist before they do

---

## Agent Behavior

Agents working in this repo should:

1. Prefer small, reviewable changes.
2. Keep API responses structured.
3. Add tests for schema changes.
4. Avoid adding broad features before the MVP is stable.
5. Preserve the narrow product wedge: release readiness first.
6. Do not turn this into a generic ASO dashboard.
7. Do not add Apple API integrations until local/manual workflows are useful.
8. Keep generated content traceable to user inputs.

---

## Environment Variables

Create `.env.example`:

```txt
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

---

## MVP Build Order

### Phase 1: Local Product Skeleton

- Create app profile form
- Store app profiles
- Create release audit form
- Generate structured release audit JSON
- Render audit results in UI
- Export audit as markdown

### Phase 2: API

- Add API key auth
- Add `/apps` endpoints
- Add `/release/audit` endpoint
- Add `/aso/generate` endpoint
- Add `/tasks/github` endpoint

### Phase 3: GitHub Workflow

- Generate GitHub issue markdown
- Export task list
- Add optional GitHub issue creation
- Add agent brief output

### Phase 4: Paid Product

- Add auth
- Add billing
- Add app limits
- Add API call limits
- Add saved audit history

### Phase 5: Integrations

- App Store Connect API
- Apple Ads API
- GitHub Actions
- MCP server

---

## First Milestone

The first useful milestone is:

> A developer can create an app profile, paste release details and a previous Apple rejection, then receive a release-risk audit, App Review notes, TestFlight checklist, StoreKit diagnostics checklist, and GitHub-ready task list.

That is enough to test the product.

---

## Success Criteria

The MVP is working when a real indie developer says:

- "This would have saved me from a rejection."
- "This helped me submit with more confidence."
- "This turned my release mess into clear tasks."
- "I would pay for this before submitting a subscription app."

---

## License

TBD.

---

## Status

Pre-MVP.

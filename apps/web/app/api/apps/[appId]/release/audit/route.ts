import { NextRequest, NextResponse } from "next/server"
import { apps } from "@/lib/store"
import { randomUUID } from "crypto"

type ReleaseIssue = {
  area: "StoreKit" | "AppReview" | "TestFlight" | "Metadata" | "ASO" | "Ads" | "Other"
  severity: "low" | "medium" | "high"
  issue: string
  recommendedFix: string
}

type GithubTask = {
  title: string
  priority: "low" | "medium" | "high"
  summary: string
  acceptanceCriteria: string[]
  labels?: string[]
}

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

function generateMockAudit(appId: string, input: {
  latestChanges: string
  knownIssues?: string
  testFlightNotes?: string
  reviewerNotes?: string
  previousRejectionText?: string
  businessModel?: string
}): ReleaseAudit {
  const issues: ReleaseIssue[] = []

  if (!input.reviewerNotes || input.reviewerNotes.trim().length < 20) {
    issues.push({
      area: "AppReview",
      severity: "high",
      issue: "Reviewer notes are missing or too brief",
      recommendedFix: "Add detailed reviewer notes explaining all features, test credentials, and any edge cases.",
    })
  }

  if ((input.businessModel === "subscription" || input.businessModel === "iap") && !input.testFlightNotes) {
    issues.push({
      area: "StoreKit",
      severity: "medium",
      issue: "Subscription app missing TestFlight StoreKit testing notes",
      recommendedFix: "Document sandbox account testing steps for all subscription tiers.",
    })
  }

  if (input.knownIssues && input.knownIssues.trim().length > 0) {
    issues.push({
      area: "Other",
      severity: "medium",
      issue: "Known issues present in release",
      recommendedFix: "Resolve known issues before submission or document mitigation steps.",
    })
  }

  const tasks: GithubTask[] = issues.map((issue) => ({
    title: `[${issue.area}] ${issue.issue}`,
    priority: issue.severity,
    summary: issue.recommendedFix,
    acceptanceCriteria: [
      `The following issue is resolved: ${issue.issue}`,
      "Verified in TestFlight or staging environment",
    ],
    labels: ["app-store", issue.area.toLowerCase(), issue.severity],
  }))

  const riskScore = Math.min(100, issues.length * 25 + (input.previousRejectionText ? 20 : 0))

  return {
    id: randomUUID(),
    appId,
    releaseRiskScore: riskScore,
    summary: `Release audit complete. Found ${issues.length} issue(s). Risk score: ${riskScore}/100. ${riskScore < 30 ? "Release looks healthy." : riskScore < 60 ? "Some issues should be addressed." : "High risk - resolve blocking issues before submission."}`,
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
      storeKit: (input.businessModel === "subscription" || input.businessModel === "iap")
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

async function generateAIAudit(appId: string, input: {
  latestChanges: string
  knownIssues?: string
  testFlightNotes?: string
  reviewerNotes?: string
  previousRejectionText?: string
  businessModel?: string
  appName?: string
  category?: string
}): Promise<ReleaseAudit> {
  const OpenAI = (await import("openai")).default
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const systemPrompt = `You are an App Store release readiness expert. Analyze the provided release information and return a JSON release audit.

Return ONLY valid JSON matching this exact structure:
{
  "releaseRiskScore": number (0-100),
  "summary": "string",
  "blockingIssues": [{"area": "StoreKit|AppReview|TestFlight|Metadata|ASO|Ads|Other", "severity": "low|medium|high", "issue": "string", "recommendedFix": "string"}],
  "checklists": {
    "testFlight": ["string"],
    "appReview": ["string"],
    "storeKit": ["string"] or null
  },
  "githubTasks": [{"title": "string", "priority": "low|medium|high", "summary": "string", "acceptanceCriteria": ["string"], "labels": ["string"]}]
}`

  const userPrompt = `App: ${input.appName ?? "Unknown"} (${input.category ?? "Unknown category"}, ${input.businessModel ?? "unknown"} model)

Latest Changes: ${input.latestChanges}
${input.knownIssues ? `Known Issues: ${input.knownIssues}` : ""}
${input.testFlightNotes ? `TestFlight Notes: ${input.testFlightNotes}` : ""}
${input.reviewerNotes ? `Reviewer Notes: ${input.reviewerNotes}` : ""}
${input.previousRejectionText ? `Previous Rejection: ${input.previousRejectionText}` : ""}`

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("Empty response from OpenAI")

  const parsed = JSON.parse(content)
  return {
    id: randomUUID(),
    appId,
    releaseRiskScore: parsed.releaseRiskScore ?? 50,
    summary: parsed.summary ?? "",
    blockingIssues: parsed.blockingIssues ?? [],
    checklists: {
      testFlight: parsed.checklists?.testFlight ?? [],
      appReview: parsed.checklists?.appReview ?? [],
      storeKit: parsed.checklists?.storeKit ?? undefined,
    },
    githubTasks: parsed.githubTasks ?? [],
    createdAt: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const app = apps.get(appId)
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

  const body = await req.json()
  const input = {
    latestChanges: body.latestChanges ?? "",
    knownIssues: body.knownIssues,
    testFlightNotes: body.testFlightNotes,
    reviewerNotes: body.reviewerNotes,
    previousRejectionText: body.previousRejectionText,
    businessModel: app.businessModel,
    appName: app.name,
    category: app.category,
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const audit = await generateAIAudit(appId, input)
      return NextResponse.json(audit)
    } catch (err) {
      console.error("OpenAI audit failed, falling back to mock:", err)
    }
  }

  const audit = generateMockAudit(appId, input)
  return NextResponse.json(audit)
}

import { NextRequest, NextResponse } from "next/server"
import { getApp } from "@/lib/app-store"
import { saveAudit } from "@/lib/audit-store"
import { ReleaseAuditInputSchema } from "@/lib/schemas"
import { generateMockAudit, type AuditInput } from "@core/release-audit"
import type { ReleaseAudit } from "@/lib/types"
import { randomUUID } from "crypto"
import { requireApiKey } from "@/lib/api-key-auth"

async function generateAIAudit(
  appId: string,
  input: {
    latestChanges: string
    knownIssues?: string
    testFlightNotes?: string
    reviewerNotes?: string
    previousRejectionText?: string
    businessModel?: string
    appName?: string
    category?: string
  }
): Promise<ReleaseAudit> {
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

async function resolveAudit(appId: string, mockInput: AuditInput): Promise<ReleaseAudit> {
  if (!process.env.OPENAI_API_KEY) return generateMockAudit(mockInput)
  try {
    return await generateAIAudit(appId, {
      latestChanges: mockInput.latestChanges,
      knownIssues: mockInput.knownIssues,
      testFlightNotes: mockInput.testFlightNotes,
      reviewerNotes: mockInput.reviewerNotes,
      previousRejectionText: mockInput.previousRejectionText,
      businessModel: mockInput.app.businessModel,
      appName: mockInput.app.name,
      category: mockInput.app.category,
    })
  } catch (err) {
    console.error("OpenAI audit failed, falling back to mock:", err)
    return generateMockAudit(mockInput)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  const authError = requireApiKey(req)
  if (authError) return authError
  const app = getApp(appId)
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

  const body = await req.json()
  const parsed = ReleaseAuditInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { latestChanges, knownIssues, testFlightNotes, reviewerNotes, previousRejectionText } =
    parsed.data

  const mockInput: AuditInput = { app, latestChanges, knownIssues, testFlightNotes, reviewerNotes, previousRejectionText }
  const audit = await resolveAudit(appId, mockInput)

  saveAudit(audit)
  return NextResponse.json(audit)
}

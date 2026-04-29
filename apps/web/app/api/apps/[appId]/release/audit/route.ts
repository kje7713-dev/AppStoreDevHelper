import { NextRequest, NextResponse } from "next/server"
import { apps } from "@/lib/store"
import { saveAudit } from "@/lib/audit-store"
import { generateMockAudit } from "@appops/core/release-audit"
import { ReleaseAuditInputSchema } from "@appops/schemas/release.zod"
import type { ReleaseAudit } from "@/lib/types"
import { randomUUID } from "crypto"

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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const result = ReleaseAuditInputSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const input = result.data

  let audit: ReleaseAudit

  if (process.env.OPENAI_API_KEY) {
    try {
      audit = await generateAIAudit(appId, {
        ...input,
        businessModel: app.businessModel,
        appName: app.name,
        category: app.category,
      })
    } catch (err) {
      console.error("OpenAI audit failed, falling back to mock:", err)
      audit = generateMockAudit({ app, ...input })
    }
  } else {
    audit = generateMockAudit({ app, ...input })
  }

  saveAudit(audit)
  return NextResponse.json(audit)
}

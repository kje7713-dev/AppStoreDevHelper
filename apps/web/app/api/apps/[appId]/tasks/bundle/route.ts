import { NextRequest, NextResponse } from "next/server"
import { getApp } from "@/lib/app-store"
import { TaskBundleInputSchema } from "@/lib/schemas"
import { getLatestAuditForApp, getAudit } from "@/lib/audit-store"
import { getSpecsForApp, getSpec } from "@/lib/storekit-store"
import { getLatestAppReviewForApp, getAppReview } from "@/lib/app-review-store"
import { getLatestAsoOutputForApp, getAsoOutput } from "@/lib/aso-store"
import { generateTaskBundle } from "@core/tasks"
import { requireApiKey } from "@/lib/api-key-auth"

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
  const parsed = TaskBundleInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const input = parsed.data

  // Fetch sources from their respective stores
  const releaseAudit = input.includeReleaseAuditTasks
    ? (input.releaseAuditId ? getAudit(input.releaseAuditId) : getLatestAuditForApp(appId)) ??
      undefined
    : undefined

  const storeKitSpec = input.includeStoreKitTasks
    ? (input.storeKitSpecId ? getSpec(input.storeKitSpecId) : getSpecsForApp(appId)[0]) ??
      undefined
    : undefined

  const appReviewResponse = input.includeAppReviewTasks
    ? (input.appReviewResponseId
        ? getAppReview(input.appReviewResponseId)
        : getLatestAppReviewForApp(appId)) ?? undefined
    : undefined

  const asoOutput = input.includeAsoTasks
    ? (input.asoOutputId ? getAsoOutput(input.asoOutputId) : getLatestAsoOutputForApp(appId)) ??
      undefined
    : undefined

  const bundle = generateTaskBundle(appId, input, {
    releaseAudit,
    storeKitSpec,
    appReviewResponse,
    asoOutput,
  })

  return NextResponse.json(bundle, { status: 201 })
}

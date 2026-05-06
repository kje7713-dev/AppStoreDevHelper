import { NextRequest, NextResponse } from "next/server"
import { getApp } from "@/lib/app-store"
import { ReleasePackageInputSchema } from "@/lib/schemas"
import { getLatestAuditForApp } from "@/lib/audit-store"
import { getSpecsForApp } from "@/lib/storekit-store"
import { getLatestAppReviewForApp } from "@/lib/app-review-store"
import { getLatestAsoOutputForApp } from "@/lib/aso-store"
import { saveReleasePackage } from "@/lib/release-package-store"
import { generateReleasePackage } from "@core/release-package"
import { generateTaskBundle } from "@core/tasks"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  const app = getApp(appId)
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

  const body = await req.json()
  const parsed = ReleasePackageInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const input = parsed.data

  const audit = input.includeLatestAudit ? getLatestAuditForApp(appId) : undefined
  const storeKitSpec = input.includeLatestStoreKitSpec
    ? getSpecsForApp(appId)[0]
    : undefined
  const appReviewResponse = input.includeLatestAppReviewResponse
    ? getLatestAppReviewForApp(appId)
    : undefined
  const asoOutput = input.includeLatestAsoOutput
    ? getLatestAsoOutputForApp(appId)
    : undefined

  // Task bundles are not persisted; generate one inline from available sources.
  let taskBundle: ReturnType<typeof generateTaskBundle> | undefined
  if (input.includeLatestTaskBundle) {
    taskBundle = generateTaskBundle(
      appId,
      {
        includeReleaseAuditTasks: true,
        includeStoreKitTasks: true,
        includeAppReviewTasks: true,
        includeAsoTasks: true,
      },
      {
        releaseAudit: audit ? { githubTasks: audit.githubTasks } : undefined,
        storeKitSpec: storeKitSpec ? { githubTask: storeKitSpec.githubTask } : undefined,
        appReviewResponse: appReviewResponse
          ? { internalTasks: appReviewResponse.internalTasks }
          : undefined,
        asoOutput: asoOutput ? { githubTask: asoOutput.githubTask } : undefined,
      }
    )
  }

  const pkg = generateReleasePackage(appId, app.name, input, {
    audit,
    storeKitSpec,
    appReviewResponse,
    asoOutput,
    taskBundle: taskBundle
      ? {
          id: taskBundle.id,
          summary: taskBundle.summary,
          taskCount: taskBundle.taskCount,
          bundleMarkdown: taskBundle.bundleMarkdown,
          agentImplementationBrief: taskBundle.agentImplementationBrief,
        }
      : undefined,
  })

  saveReleasePackage(pkg)

  return NextResponse.json(pkg, { status: 201 })
}

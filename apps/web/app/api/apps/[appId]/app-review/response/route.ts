import { NextRequest, NextResponse } from "next/server"
import { getApp } from "@/lib/app-store"
import { AppReviewResponseInputSchema } from "@/lib/schemas"
import { saveAppReview } from "@/lib/app-review-store"
import { generateAppReviewResponse } from "@core/app-review"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  const app = getApp(appId)
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

  const body = await req.json()
  const parsed = AppReviewResponseInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const response = generateAppReviewResponse(appId, parsed.data)
  saveAppReview(response)
  return NextResponse.json(response, { status: 201 })
}

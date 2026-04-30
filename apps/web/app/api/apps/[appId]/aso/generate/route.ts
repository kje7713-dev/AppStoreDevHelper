import { NextRequest, NextResponse } from "next/server"
import { getApp } from "@/lib/app-store"
import { AsoGenerateInputSchema } from "@/lib/schemas"
import { generateAsoMetadata } from "@core/aso"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  const app = getApp(appId)
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

  const body = await req.json()
  const parsed = AsoGenerateInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const result = generateAsoMetadata(appId, parsed.data, app)
  return NextResponse.json(result, { status: 201 })
}

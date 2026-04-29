import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { apps, AppProfile } from "@/lib/store"
import { CreateAppProfileSchema } from "@appops/schemas/app.zod"

export async function GET() {
  return NextResponse.json(Array.from(apps.values()))
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const result = CreateAppProfileSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = result.data
  const now = new Date().toISOString()
  const app: AppProfile = {
    id: randomUUID(),
    name: data.name,
    platform: "ios",
    bundleId: data.bundleId,
    appStoreUrl: data.appStoreUrl || undefined,
    category: data.category,
    targetAudience: data.targetAudience,
    businessModel: data.businessModel,
    currentMetadata: data.currentMetadata,
    createdAt: now,
    updatedAt: now,
  }

  apps.set(app.id, app)
  return NextResponse.json(app, { status: 201 })
}

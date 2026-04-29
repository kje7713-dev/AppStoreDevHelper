import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { apps, AppProfile } from "@/lib/store"

export async function GET() {
  return NextResponse.json(Array.from(apps.values()))
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const now = new Date().toISOString()
  const app: AppProfile = {
    id: randomUUID(),
    name: body.name,
    platform: "ios",
    bundleId: body.bundleId,
    appStoreUrl: body.appStoreUrl,
    category: body.category,
    targetAudience: body.targetAudience,
    businessModel: body.businessModel,
    currentMetadata: body.currentMetadata,
    createdAt: now,
    updatedAt: now,
  }

  apps.set(app.id, app)
  return NextResponse.json(app, { status: 201 })
}

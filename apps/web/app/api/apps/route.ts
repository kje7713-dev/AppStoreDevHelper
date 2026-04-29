import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { apps, AppProfile } from "@/lib/store"
import { CreateAppProfileSchema } from "@/lib/schemas"

export async function GET() {
  return NextResponse.json(Array.from(apps.values()))
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const parsed = CreateAppProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const app: AppProfile = {
    id: randomUUID(),
    platform: "ios",
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  }

  apps.set(app.id, app)
  return NextResponse.json(app, { status: 201 })
}

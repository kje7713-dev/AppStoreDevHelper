import { NextRequest, NextResponse } from "next/server"
import { apps } from "@/lib/store"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const app = apps.get(appId)
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(app)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const existing = apps.get(appId)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const updated = {
    ...existing,
    ...body,
    id: appId,
    updatedAt: new Date().toISOString(),
  }
  apps.set(appId, updated)
  return NextResponse.json(updated)
}

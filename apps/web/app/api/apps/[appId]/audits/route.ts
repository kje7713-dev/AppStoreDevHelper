import { NextRequest, NextResponse } from "next/server"
import { getApp } from "@/lib/app-store"
import { getAuditsForApp } from "@/lib/audit-store"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  if (!getApp(appId)) return NextResponse.json({ error: "App not found" }, { status: 404 })
  return NextResponse.json(getAuditsForApp(appId))
}

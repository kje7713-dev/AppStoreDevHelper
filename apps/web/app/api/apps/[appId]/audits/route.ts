import { NextRequest, NextResponse } from "next/server"
import { apps } from "@/lib/store"
import { getAuditsForApp } from "@/lib/audit-store"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  if (!apps.get(appId)) return NextResponse.json({ error: "App not found" }, { status: 404 })
  const audits = getAuditsForApp(appId)
  return NextResponse.json(audits)
}

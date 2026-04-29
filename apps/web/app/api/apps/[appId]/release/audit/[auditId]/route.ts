import { NextRequest, NextResponse } from "next/server"
import { apps } from "@/lib/store"
import { getAudit } from "@/lib/audit-store"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string; auditId: string }> }
) {
  const { appId, auditId } = await params
  const app = apps.get(appId)
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

  const audit = getAudit(auditId)
  if (!audit || audit.appId !== appId) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 })
  }

  return NextResponse.json(audit)
}

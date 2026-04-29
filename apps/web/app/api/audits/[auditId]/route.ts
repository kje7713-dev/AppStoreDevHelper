import { NextRequest, NextResponse } from "next/server"
import { getAudit } from "@/lib/audit-store"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params
  const audit = getAudit(auditId)
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(audit)
}

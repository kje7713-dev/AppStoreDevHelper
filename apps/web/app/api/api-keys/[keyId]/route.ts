import { NextRequest, NextResponse } from "next/server"
import { revokeApiKey } from "@/lib/api-key-store"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await params
  const revoked = revokeApiKey(keyId)
  if (!revoked) return NextResponse.json({ error: "API key not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}

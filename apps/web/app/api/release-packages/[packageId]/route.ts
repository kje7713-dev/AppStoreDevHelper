import { NextRequest, NextResponse } from "next/server"
import { getReleasePackage } from "@/lib/release-package-store"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  const { packageId } = await params
  const pkg = getReleasePackage(packageId)
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(pkg)
}

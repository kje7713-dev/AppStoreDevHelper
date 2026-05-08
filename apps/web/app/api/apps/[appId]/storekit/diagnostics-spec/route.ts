import { NextRequest, NextResponse } from "next/server"
import { getApp } from "@/lib/app-store"
import { saveSpec } from "@/lib/storekit-store"
import { StoreKitDiagnosticsInputSchema } from "@/lib/schemas"
import { generateStoreKitDiagnosticsSpec } from "@core/storekit"
import { requireApiKey } from "@/lib/api-key-auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  const authError = requireApiKey(req)
  if (authError) return authError
  const app = getApp(appId)
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 })

  const body = await req.json()
  const parsed = StoreKitDiagnosticsInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const spec = generateStoreKitDiagnosticsSpec(appId, parsed.data)
  saveSpec(spec)
  return NextResponse.json(spec, { status: 201 })
}

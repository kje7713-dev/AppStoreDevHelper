import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createApiKey, listApiKeys } from "@/lib/api-key-store"

const CreateApiKeyInputSchema = z.object({
  label: z.string().min(1).max(80),
})

export async function GET(_req: NextRequest) {
  return NextResponse.json(listApiKeys())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateApiKeyInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { key, rawKey } = createApiKey(parsed.data.label)
  return NextResponse.json({ ...key, rawKey }, { status: 201 })
}

import { NextRequest, NextResponse } from "next/server"
import { hasActiveApiKeys, validateApiKey } from "@/lib/api-key-store"

function extractBearerToken(authorizationHeader: string | null): string | undefined {
  if (!authorizationHeader) return undefined
  const [scheme, token] = authorizationHeader.split(" ")
  if (scheme?.toLowerCase() !== "bearer") return undefined
  const trimmed = token?.trim()
  return trimmed ? trimmed : undefined
}

export function requireApiKey(req: NextRequest): NextResponse | undefined {
  if (!hasActiveApiKeys()) return undefined

  const token = extractBearerToken(req.headers.get("authorization"))
  if (!token) {
    return NextResponse.json(
      { error: "Missing API key. Provide Authorization: Bearer <api-key>." },
      { status: 401 }
    )
  }

  if (!validateApiKey(token)) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 })
  }

  return undefined
}

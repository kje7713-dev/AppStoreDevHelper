import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto"
import { join } from "path"
import { z } from "zod"

const StoredApiKeySchema = z.object({
  id: z.string(),
  label: z.string(),
  keyHash: z.string(),
  keyPreview: z.string(),
  createdAt: z.string(),
  revokedAt: z.string().optional(),
})

type StoredApiKey = z.infer<typeof StoredApiKeySchema>

export type ApiKeyRecord = {
  id: string
  label: string
  keyPreview: string
  createdAt: string
  revokedAt?: string
}

function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex")
}

function toRecord(stored: StoredApiKey): ApiKeyRecord {
  return {
    id: stored.id,
    label: stored.label,
    keyPreview: stored.keyPreview,
    createdAt: stored.createdAt,
    revokedAt: stored.revokedAt,
  }
}

export function maskApiKey(rawKey: string): string {
  if (!rawKey) return ""
  const first = rawKey.slice(0, 8)
  const last = rawKey.slice(-4)
  return `${first}${rawKey.length > 12 ? "…" : ""}${last}`
}

export function createApiKeyStore(dataDir: string) {
  const apiKeysFile = join(dataDir, "api-keys.json")

  function ensureDataDir(): void {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  function readApiKeys(): StoredApiKey[] {
    try {
      if (!existsSync(apiKeysFile)) return []
      const raw = readFileSync(apiKeysFile, "utf-8")
      const parsed: unknown[] = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      const validKeys: StoredApiKey[] = []
      parsed.forEach((item) => {
        const result = StoredApiKeySchema.safeParse(item)
        if (!result.success) {
          console.warn("[api-key-store] Skipping invalid API key record:", result.error.flatten())
          return
        }
        validKeys.push(result.data)
      })
      return validKeys
    } catch {
      return []
    }
  }

  function writeApiKeys(keys: StoredApiKey[]): void {
    ensureDataDir()
    writeFileSync(apiKeysFile, JSON.stringify(keys, null, 2), "utf-8")
  }

  function createApiKey(label: string): { key: ApiKeyRecord; rawKey: string } {
    const now = new Date().toISOString()
    const rawKey = `appops_${randomBytes(24).toString("base64url")}`
    const stored: StoredApiKey = {
      id: randomUUID(),
      label: label.trim(),
      keyHash: hashApiKey(rawKey),
      keyPreview: maskApiKey(rawKey),
      createdAt: now,
    }
    const keys = readApiKeys()
    keys.push(stored)
    writeApiKeys(keys)
    return { key: toRecord(stored), rawKey }
  }

  function listApiKeys(): ApiKeyRecord[] {
    return readApiKeys()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toRecord)
  }

  function revokeApiKey(id: string): boolean {
    const keys = readApiKeys()
    const idx = keys.findIndex((k) => k.id === id)
    if (idx < 0) return false
    if (!keys[idx].revokedAt) {
      keys[idx].revokedAt = new Date().toISOString()
      writeApiKeys(keys)
    }
    return true
  }

  function hasActiveApiKeys(): boolean {
    return readApiKeys().some((k) => !k.revokedAt)
  }

  function validateApiKey(rawKey: string): ApiKeyRecord | undefined {
    if (!rawKey) return undefined
    const inputHash = hashApiKey(rawKey)
    const inputBuffer = Buffer.from(inputHash, "hex")
    const matchingKey = readApiKeys().find((stored) => {
      if (stored.revokedAt) return false
      if (!/^[a-f0-9]{64}$/.test(stored.keyHash)) return false
      const storedBuffer = Buffer.from(stored.keyHash, "hex")
      if (inputBuffer.length !== storedBuffer.length) return false
      return timingSafeEqual(inputBuffer, storedBuffer)
    })
    return matchingKey ? toRecord(matchingKey) : undefined
  }

  return { createApiKey, listApiKeys, revokeApiKey, hasActiveApiKeys, validateApiKey }
}

const DEFAULT_DATA_DIR = join(process.cwd(), ".data")
const defaultStore = createApiKeyStore(DEFAULT_DATA_DIR)

export const { createApiKey, listApiKeys, revokeApiKey, hasActiveApiKeys, validateApiKey } = defaultStore

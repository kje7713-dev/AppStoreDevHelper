import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { z } from "zod"
import type { ReleaseAudit } from "./types"

// File-based JSON storage for audit history.
// Data lives at <project-root>/.data/audits.json.
// NOTE: This is a simple local store for the MVP. Replace with a database for production.

const DATA_DIR = join(process.cwd(), ".data")
const AUDITS_FILE = join(DATA_DIR, "audits.json")

// Lightweight schema to validate persisted audit records on read.
const StoredAuditSchema = z.object({
  id: z.string(),
  appId: z.string(),
  releaseRiskScore: z.number(),
  summary: z.string(),
  blockingIssues: z.array(z.unknown()),
  checklists: z.object({
    testFlight: z.array(z.string()),
    appReview: z.array(z.string()),
    storeKit: z.array(z.string()).optional(),
  }),
  githubTasks: z.array(z.unknown()),
  createdAt: z.string(),
})

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readAudits(): ReleaseAudit[] {
  try {
    if (!existsSync(AUDITS_FILE)) return []
    const raw = readFileSync(AUDITS_FILE, "utf-8")
    const parsed: unknown[] = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => StoredAuditSchema.safeParse(item).success) as ReleaseAudit[]
  } catch {
    return []
  }
}

function writeAudits(audits: ReleaseAudit[]): void {
  ensureDataDir()
  writeFileSync(AUDITS_FILE, JSON.stringify(audits, null, 2), "utf-8")
}

export function saveAudit(audit: ReleaseAudit): void {
  const audits = readAudits()
  // Replace if same ID already exists (idempotent)
  const idx = audits.findIndex((a) => a.id === audit.id)
  if (idx >= 0) {
    audits[idx] = audit
  } else {
    audits.push(audit)
  }
  writeAudits(audits)
}

export function getAudit(id: string): ReleaseAudit | undefined {
  return readAudits().find((a) => a.id === id)
}

export function getAuditsForApp(appId: string): ReleaseAudit[] {
  return readAudits()
    .filter((a) => a.appId === appId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getLatestAuditForApp(appId: string): ReleaseAudit | undefined {
  return getAuditsForApp(appId)[0]
}

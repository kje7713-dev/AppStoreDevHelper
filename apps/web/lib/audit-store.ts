import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import type { ReleaseAudit } from "./types"

const DATA_DIR = join(process.cwd(), ".data")
const AUDITS_FILE = join(DATA_DIR, "audits.json")

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readAll(): Map<string, ReleaseAudit> {
  try {
    ensureDataDir()
    if (!existsSync(AUDITS_FILE)) return new Map()
    const raw = readFileSync(AUDITS_FILE, "utf-8")
    const arr = JSON.parse(raw) as ReleaseAudit[]
    return new Map(arr.map((a) => [a.id, a]))
  } catch {
    return new Map()
  }
}

function writeAll(audits: Map<string, ReleaseAudit>): void {
  ensureDataDir()
  writeFileSync(AUDITS_FILE, JSON.stringify(Array.from(audits.values()), null, 2), "utf-8")
}

export function saveAudit(audit: ReleaseAudit): void {
  const audits = readAll()
  audits.set(audit.id, audit)
  writeAll(audits)
}

export function getAudit(id: string): ReleaseAudit | undefined {
  return readAll().get(id)
}

export function getAuditsForApp(appId: string): ReleaseAudit[] {
  const audits = readAll()
  return Array.from(audits.values())
    .filter((a) => a.appId === appId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

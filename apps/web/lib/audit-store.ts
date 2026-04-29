/**
 * Simple file-based audit storage.
 * Stores audits as a JSON file in .data/audits.json relative to the working directory.
 * This is a local-only implementation suitable for development and single-instance deployments.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import type { ReleaseAudit } from "./types"

const DATA_DIR = join(process.cwd(), ".data")
const AUDITS_FILE = join(DATA_DIR, "audits.json")

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readAll(): Record<string, ReleaseAudit> {
  ensureDataDir()
  if (!existsSync(AUDITS_FILE)) return {}
  try {
    return JSON.parse(readFileSync(AUDITS_FILE, "utf-8"))
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, ReleaseAudit>) {
  ensureDataDir()
  writeFileSync(AUDITS_FILE, JSON.stringify(data, null, 2), "utf-8")
}

export function saveAudit(audit: ReleaseAudit): void {
  const all = readAll()
  all[audit.id] = audit
  writeAll(all)
}

export function getAudit(auditId: string): ReleaseAudit | undefined {
  const all = readAll()
  return all[auditId]
}

export function listAuditsForApp(appId: string): ReleaseAudit[] {
  const all = readAll()
  return Object.values(all)
    .filter((a) => a.appId === appId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getLatestAuditForApp(appId: string): ReleaseAudit | undefined {
  return listAuditsForApp(appId)[0]
}

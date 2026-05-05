import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { z } from "zod"
import type { AsoOutput } from "./types"

// File-based JSON storage for ASO metadata outputs.
// Data lives at <project-root>/.data/aso-outputs.json.
// NOTE: This is a simple local store for the MVP. Replace with a database for production.

const DATA_DIR = join(process.cwd(), ".data")
const ASO_FILE = join(DATA_DIR, "aso-outputs.json")

const GithubTaskSchema = z.object({
  title: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  summary: z.string(),
  acceptanceCriteria: z.array(z.string()),
  labels: z.array(z.string()).optional(),
})

const AsoTextOptionSchema = z.object({
  text: z.string(),
  charCount: z.number(),
})

const StoredAsoSchema = z.object({
  id: z.string(),
  appId: z.string(),
  summary: z.string(),
  subtitleOptions: z.array(AsoTextOptionSchema),
  promotionalTextOptions: z.array(AsoTextOptionSchema),
  keywordFieldOptions: z.array(
    z.object({ text: z.string(), charCount: z.number(), keywords: z.array(z.string()) })
  ),
  descriptionOptions: z.array(
    z.object({ name: z.string(), text: z.string(), charCount: z.number() })
  ),
  releaseNotesOptions: z.array(AsoTextOptionSchema),
  warnings: z.array(z.string()),
  negativeKeywords: z.array(z.string()),
  githubTask: GithubTaskSchema,
  createdAt: z.string(),
})

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readOutputs(): AsoOutput[] {
  try {
    if (!existsSync(ASO_FILE)) return []
    const raw = readFileSync(ASO_FILE, "utf-8")
    const parsed: unknown[] = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => {
      const result = StoredAsoSchema.safeParse(item)
      if (!result.success) {
        console.warn("[aso-store] Skipping invalid record:", result.error.flatten())
      }
      return result.success
    }) as AsoOutput[]
  } catch {
    return []
  }
}

function writeOutputs(outputs: AsoOutput[]): void {
  ensureDataDir()
  writeFileSync(ASO_FILE, JSON.stringify(outputs, null, 2), "utf-8")
}

export function saveAsoOutput(output: AsoOutput): void {
  const outputs = readOutputs()
  const idx = outputs.findIndex((o) => o.id === output.id)
  if (idx >= 0) {
    outputs[idx] = output
  } else {
    outputs.push(output)
  }
  writeOutputs(outputs)
}

export function getAsoOutput(id: string): AsoOutput | undefined {
  return readOutputs().find((o) => o.id === id)
}

export function getAsoOutputsForApp(appId: string): AsoOutput[] {
  return readOutputs()
    .filter((o) => o.appId === appId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getLatestAsoOutputForApp(appId: string): AsoOutput | undefined {
  return getAsoOutputsForApp(appId)[0]
}

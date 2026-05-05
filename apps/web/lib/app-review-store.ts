import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { z } from "zod"
import type { AppReviewResponse } from "./types"

// File-based JSON storage for App Review responses.
// Data lives at <project-root>/.data/app-review-responses.json.
// NOTE: This is a simple local store for the MVP. Replace with a database for production.

const DATA_DIR = join(process.cwd(), ".data")
const REVIEWS_FILE = join(DATA_DIR, "app-review-responses.json")

const StoredReviewSchema = z.object({
  id: z.string(),
  appId: z.string(),
  summary: z.string(),
  detectedIssueType: z.enum([
    "StoreKit",
    "Metadata",
    "Crash",
    "Login",
    "Privacy",
    "Guideline",
    "Performance",
    "Other",
  ]),
  riskLevel: z.enum(["low", "medium", "high"]),
  appReviewResponse: z.string(),
  reviewerTestingInstructions: z.string(),
  resubmissionNotes: z.string(),
  internalTasks: z.array(z.unknown()),
  missingInfo: z.array(z.string()),
  createdAt: z.string(),
})

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readReviews(): AppReviewResponse[] {
  try {
    if (!existsSync(REVIEWS_FILE)) return []
    const raw = readFileSync(REVIEWS_FILE, "utf-8")
    const parsed: unknown[] = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => {
      const result = StoredReviewSchema.safeParse(item)
      if (!result.success) {
        console.warn("[app-review-store] Skipping invalid record:", result.error.flatten())
      }
      return result.success
    }) as AppReviewResponse[]
  } catch {
    return []
  }
}

function writeReviews(reviews: AppReviewResponse[]): void {
  ensureDataDir()
  writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf-8")
}

export function saveAppReview(review: AppReviewResponse): void {
  const reviews = readReviews()
  const idx = reviews.findIndex((r) => r.id === review.id)
  if (idx >= 0) {
    reviews[idx] = review
  } else {
    reviews.push(review)
  }
  writeReviews(reviews)
}

export function getAppReview(id: string): AppReviewResponse | undefined {
  return readReviews().find((r) => r.id === id)
}

export function getAppReviewsForApp(appId: string): AppReviewResponse[] {
  return readReviews()
    .filter((r) => r.appId === appId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getLatestAppReviewForApp(appId: string): AppReviewResponse | undefined {
  return getAppReviewsForApp(appId)[0]
}

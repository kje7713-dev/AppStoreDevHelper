import type { GithubTask } from "./task"

export type AsoTone = "professional" | "direct" | "bold" | "minimal"
export type AsoLocalization = "none" | "starter"

export type AsoInput = {
  appName?: string
  category?: string
  targetAudience?: string
  primaryBenefit?: string
  differentiators?: string[]
  competitorApps?: string[]
  currentSubtitle?: string
  currentKeywords?: string
  currentPromotionalText?: string
  currentDescription?: string
  tone: AsoTone
  includeNegativeKeywords?: boolean
  localization?: AsoLocalization
}

export type AsoTextOption = {
  text: string
  charCount: number
}

export type AsoKeywordOption = {
  text: string
  charCount: number
  keywords: string[]
}

export type AsoDescriptionOption = {
  name: string
  text: string
  charCount: number
}

export type AsoOutput = {
  id: string
  appId: string
  summary: string
  subtitleOptions: AsoTextOption[]
  promotionalTextOptions: AsoTextOption[]
  keywordFieldOptions: AsoKeywordOption[]
  descriptionOptions: AsoDescriptionOption[]
  releaseNotesOptions: AsoTextOption[]
  warnings: string[]
  negativeKeywords: string[]
  githubTask: GithubTask
  createdAt: string
}

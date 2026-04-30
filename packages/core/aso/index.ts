import { randomUUID } from "crypto"
import type { AppProfile } from "../../schemas/app"
import type {
  AsoInput,
  AsoOutput,
  AsoTone,
  AsoTextOption,
  AsoKeywordOption,
  AsoDescriptionOption,
} from "../../schemas/aso"

// ── Character limits ──────────────────────────────────────────────────────────

export const ASO_LIMITS = {
  subtitle: 30,
  promotionalText: 170,
  keywords: 100,
  description: 4000,
  releaseNotes: 4000,
} as const

const WARNING_THRESHOLD = 0.9 // warn when >= 90% of limit used

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(text: string, limit: number): string {
  if (text.length <= limit) return text
  // Trim at last word boundary within limit
  const trimmed = text.slice(0, limit)
  const lastSpace = trimmed.lastIndexOf(" ")
  return lastSpace > limit * 0.5 ? trimmed.slice(0, lastSpace).trimEnd() : trimmed
}

function charCount(text: string): number {
  return text.length
}

function checkWarning(text: string, limit: number, fieldName: string): string | null {
  const ratio = text.length / limit
  if (text.length > limit) {
    return `${fieldName} exceeds the ${limit}-character limit (${text.length}/${limit}).`
  }
  if (ratio >= WARNING_THRESHOLD) {
    return `${fieldName} is near the ${limit}-character limit (${text.length}/${limit}).`
  }
  return null
}

function toKeywordList(raw: string): string[] {
  return raw
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0)
}

function formatKeywords(keywords: string[]): string {
  // Comma-separated without spaces after commas (Apple format)
  return keywords.join(",")
}

// ── Subtitle generation ───────────────────────────────────────────────────────

function buildSubtitles(
  appName: string,
  input: AsoInput,
  tone: AsoTone
): AsoTextOption[] {
  const { category, targetAudience, primaryBenefit, differentiators } = input
  const cat = category ?? "productivity"
  const audience = targetAudience ?? "everyone"
  const benefit = primaryBenefit ?? ""
  const diff = differentiators?.[0] ?? ""

  const candidates: string[] = []

  if (benefit) {
    candidates.push(benefit)
  }

  if (diff) {
    candidates.push(diff)
  }

  switch (tone) {
    case "bold":
      candidates.push(`${cat} built differently`)
      candidates.push(`The ${cat} app you need`)
      break
    case "direct":
      candidates.push(`${cat} for ${audience}`)
      candidates.push(`Fast ${cat} tools`)
      break
    case "minimal":
      candidates.push(cat.charAt(0).toUpperCase() + cat.slice(1))
      candidates.push(`Simple ${cat}`)
      break
    default: // professional
      candidates.push(`${cat.charAt(0).toUpperCase() + cat.slice(1)} for ${audience}`)
      candidates.push(`Smart ${cat} tools`)
  }

  // Deduplicate and clamp
  const seen = new Set<string>()
  const options: AsoTextOption[] = []

  for (const raw of candidates) {
    const text = clamp(raw, ASO_LIMITS.subtitle)
    if (!seen.has(text)) {
      seen.add(text)
      options.push({ text, charCount: charCount(text) })
    }
    if (options.length >= 3) break
  }

  return options
}

// ── Promotional text generation ───────────────────────────────────────────────

function buildPromotionalTexts(
  appName: string,
  input: AsoInput,
  tone: AsoTone
): AsoTextOption[] {
  const { targetAudience, primaryBenefit, differentiators } = input
  const audience = targetAudience ?? "everyone"
  const benefit = primaryBenefit ?? `${appName} on your iPhone`
  const diffs = differentiators ?? []

  const firstDiff = diffs[0] ?? ""
  const secondDiff = diffs[1] ?? ""

  const candidates: string[] = []

  switch (tone) {
    case "bold":
      candidates.push(
        clamp(
          `${appName} changes how ${audience} work. ${benefit}. Download and see why.`,
          ASO_LIMITS.promotionalText
        )
      )
      candidates.push(
        clamp(
          `${benefit}. ${firstDiff ? firstDiff + "." : ""} Built for ${audience}. Try it free.`.trim(),
          ASO_LIMITS.promotionalText
        )
      )
      break
    case "direct":
      candidates.push(
        clamp(
          `${benefit}. ${firstDiff ? firstDiff + ". " : ""}Available now on iPhone.`,
          ASO_LIMITS.promotionalText
        )
      )
      candidates.push(
        clamp(
          `For ${audience}: ${benefit}. ${secondDiff ? secondDiff + "." : ""}`.trim(),
          ASO_LIMITS.promotionalText
        )
      )
      break
    case "minimal":
      candidates.push(clamp(`${benefit}.`, ASO_LIMITS.promotionalText))
      candidates.push(clamp(`${appName} — for ${audience}.`, ASO_LIMITS.promotionalText))
      break
    default: // professional
      candidates.push(
        clamp(
          `${appName} helps ${audience} ${benefit.toLowerCase()}. ${firstDiff ? firstDiff + "." : ""}`.trim(),
          ASO_LIMITS.promotionalText
        )
      )
      candidates.push(
        clamp(
          `Designed for ${audience}: ${benefit}. ${secondDiff ? secondDiff + "." : ""}`.trim(),
          ASO_LIMITS.promotionalText
        )
      )
  }

  const seen = new Set<string>()
  const options: AsoTextOption[] = []

  for (const text of candidates) {
    if (!seen.has(text)) {
      seen.add(text)
      options.push({ text, charCount: charCount(text) })
    }
    if (options.length >= 2) break
  }

  return options
}

// ── Keyword generation ────────────────────────────────────────────────────────

function buildKeywordOptions(
  appName: string,
  input: AsoInput
): AsoKeywordOption[] {
  const { category, targetAudience, differentiators, currentKeywords } = input
  const cat = category?.toLowerCase() ?? ""
  const audience = targetAudience?.toLowerCase() ?? ""

  // Seed keywords from category, audience, differentiators
  const seedKeywords: string[] = []

  if (cat) seedKeywords.push(...cat.split(/\s+/))
  if (audience) seedKeywords.push(...audience.split(/\s+/).slice(0, 3))
  if (differentiators) {
    for (const d of differentiators.slice(0, 3)) {
      seedKeywords.push(
        ...d
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .slice(0, 2)
      )
    }
  }

  // Merge with current keywords if provided
  const existing = currentKeywords ? toKeywordList(currentKeywords) : []

  // Build two keyword sets: focused + broad
  const appTerms = appName.toLowerCase().split(/\s+/)

  // Filter out app name terms to avoid repetition
  const filtered = [...new Set([...existing, ...seedKeywords])]
    .filter((k) => k.length > 1 && !appTerms.includes(k))
    .slice(0, 20)

  // Focused set — tighter, higher signal
  const focused = filtered.slice(0, 10)
  const focusedStr = clamp(formatKeywords(focused), ASO_LIMITS.keywords)
  const focusedKeywords = toKeywordList(focusedStr)

  // Broad set — more terms
  const broad = filtered.slice(0, 15)
  const broadStr = clamp(formatKeywords(broad), ASO_LIMITS.keywords)
  const broadKeywords = toKeywordList(broadStr)

  const options: AsoKeywordOption[] = []

  if (focusedKeywords.length > 0) {
    options.push({
      text: focusedStr,
      charCount: charCount(focusedStr),
      keywords: focusedKeywords,
    })
  }

  if (broadKeywords.length > 0 && broadStr !== focusedStr) {
    options.push({
      text: broadStr,
      charCount: charCount(broadStr),
      keywords: broadKeywords,
    })
  }

  // Fallback if nothing was generated
  if (options.length === 0) {
    const fallback = clamp(cat || "app,ios,mobile", ASO_LIMITS.keywords)
    options.push({
      text: fallback,
      charCount: charCount(fallback),
      keywords: toKeywordList(fallback),
    })
  }

  return options
}

// ── Description generation ────────────────────────────────────────────────────

function buildDescriptions(
  appName: string,
  input: AsoInput,
  tone: AsoTone
): AsoDescriptionOption[] {
  const { targetAudience, primaryBenefit, differentiators, category } = input
  const audience = targetAudience ?? "iOS users"
  const benefit = primaryBenefit ?? "get more done"
  const cat = category ?? "productivity"
  const diffs = differentiators ?? []

  function featureBullets(): string {
    if (diffs.length > 0) {
      return diffs.map((d) => `• ${d}`).join("\n")
    }
    return `• Intuitive interface\n• Built for iOS\n• Fast and reliable`
  }

  const shortDesc = clamp(
    [
      `${appName} is a ${cat} app built for ${audience}.`,
      "",
      benefit.charAt(0).toUpperCase() + benefit.slice(1) + ".",
      "",
      "KEY FEATURES",
      featureBullets(),
      "",
      "Download now and get started in minutes.",
    ].join("\n"),
    ASO_LIMITS.description
  )

  const longDesc = clamp(
    [
      `${appName} is a ${cat} app designed to help ${audience} ${benefit.toLowerCase()}.`,
      "",
      tone === "bold"
        ? "Stop settling for slow, bloated tools. This is the app you've been waiting for."
        : tone === "direct"
          ? `Get results fast. ${appName} is focused, capable, and built for real use.`
          : tone === "minimal"
            ? `Clean. Simple. Effective.`
            : `Whether you're just getting started or scaling your workflow, ${appName} is built to keep up.`,
      "",
      "KEY FEATURES",
      featureBullets(),
      "",
      "DESIGNED FOR IOS",
      `${appName} is optimized for iPhone and iPad, with a native interface that feels right at home.`,
      "",
      `Download ${appName} and start today.`,
    ].join("\n"),
    ASO_LIMITS.description
  )

  return [
    { name: "Short", text: shortDesc, charCount: charCount(shortDesc) },
    { name: "Full", text: longDesc, charCount: charCount(longDesc) },
  ]
}

// ── Release notes generation ──────────────────────────────────────────────────

function buildReleaseNotes(appName: string, tone: AsoTone): AsoTextOption[] {
  const options: AsoTextOption[] = []

  const generic = clamp(
    tone === "minimal"
      ? "Bug fixes and performance improvements."
      : tone === "bold"
        ? `This update packs in reliability improvements and under-the-hood upgrades. Keep the feedback coming — more big things ahead.`
        : tone === "direct"
          ? `Bug fixes and stability improvements in this release. Thanks for using ${appName}.`
          : `This release includes bug fixes and performance improvements to make ${appName} faster and more reliable. Thank you for your continued support.`,
    ASO_LIMITS.releaseNotes
  )

  const withWhatIsNew = clamp(
    [
      "WHAT'S NEW",
      "",
      "• Performance improvements",
      "• Stability fixes",
      "• Minor UI refinements",
      "",
      `Thank you for using ${appName}. Feedback and reviews help us keep improving.`,
    ].join("\n"),
    ASO_LIMITS.releaseNotes
  )

  options.push({ text: generic, charCount: charCount(generic) })
  options.push({ text: withWhatIsNew, charCount: charCount(withWhatIsNew) })

  return options
}

// ── Warning collection ────────────────────────────────────────────────────────

function collectWarnings(output: Omit<AsoOutput, "warnings" | "githubTask" | "createdAt" | "id">): string[] {
  const warnings: string[] = []

  for (const opt of output.subtitleOptions) {
    const w = checkWarning(opt.text, ASO_LIMITS.subtitle, "Subtitle")
    if (w) warnings.push(w)
  }

  for (const opt of output.promotionalTextOptions) {
    const w = checkWarning(opt.text, ASO_LIMITS.promotionalText, "Promotional text")
    if (w) warnings.push(w)
  }

  for (const opt of output.keywordFieldOptions) {
    const w = checkWarning(opt.text, ASO_LIMITS.keywords, "Keyword field")
    if (w) warnings.push(w)
  }

  for (const opt of output.descriptionOptions) {
    const w = checkWarning(opt.text, ASO_LIMITS.description, `Description (${opt.name})`)
    if (w) warnings.push(w)
  }

  for (const opt of output.releaseNotesOptions) {
    const w = checkWarning(opt.text, ASO_LIMITS.releaseNotes, "Release notes")
    if (w) warnings.push(w)
  }

  return [...new Set(warnings)]
}

// ── Negative keywords ─────────────────────────────────────────────────────────

function buildNegativeKeywords(input: AsoInput): string[] {
  if (!input.includeNegativeKeywords) return []

  const negatives: string[] = [
    "free",
    "best",
    "number one",
    "#1",
    "top",
    "cheap",
    "hack",
    "crack",
    "unlimited",
    "guaranteed",
  ]

  // Add competitor app names as negative keywords
  if (input.competitorApps) {
    for (const competitor of input.competitorApps.slice(0, 5)) {
      negatives.push(competitor.toLowerCase().trim())
    }
  }

  return [...new Set(negatives)]
}

// ── GitHub task ───────────────────────────────────────────────────────────────

function buildAsoGithubTask(appName: string, input: AsoInput) {
  return {
    title: `[ASO] Update App Store metadata for ${appName}`,
    priority: "medium" as const,
    summary: `Apply generated ASO metadata to App Store Connect. Review subtitle, promotional text, keywords, description, and release notes options before publishing.`,
    acceptanceCriteria: [
      "Subtitle is updated in App Store Connect (max 30 chars)",
      "Promotional text is updated (max 170 chars)",
      "Keyword field is updated (max 100 chars, comma-separated)",
      "Description is updated (max 4000 chars)",
      "Release notes are set for the next release",
      "All metadata reviewed for accuracy before submission",
    ],
    labels: ["aso", "app-store", "metadata"],
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function generateAsoMetadata(
  appId: string,
  input: AsoInput,
  appProfile?: AppProfile
): AsoOutput {
  // Resolve app name: input > profile name > fallback
  const appName =
    input.appName?.trim() ||
    appProfile?.name?.trim() ||
    "Your App"

  // Merge profile metadata as context if not in input
  const resolvedInput: AsoInput = {
    ...input,
    category: input.category ?? appProfile?.category,
    targetAudience: input.targetAudience ?? appProfile?.targetAudience,
    currentSubtitle: input.currentSubtitle ?? appProfile?.currentMetadata?.subtitle,
    currentKeywords: input.currentKeywords ?? appProfile?.currentMetadata?.keywords,
    currentPromotionalText:
      input.currentPromotionalText ?? appProfile?.currentMetadata?.promotionalText,
    currentDescription:
      input.currentDescription ?? appProfile?.currentMetadata?.description,
  }

  const tone = resolvedInput.tone

  const subtitleOptions = buildSubtitles(appName, resolvedInput, tone)
  const promotionalTextOptions = buildPromotionalTexts(appName, resolvedInput, tone)
  const keywordFieldOptions = buildKeywordOptions(appName, resolvedInput)
  const descriptionOptions = buildDescriptions(appName, resolvedInput, tone)
  const releaseNotesOptions = buildReleaseNotes(appName, tone)
  const negativeKeywords = buildNegativeKeywords(resolvedInput)

  const partial = {
    id: randomUUID(),
    appId,
    summary: `Generated ASO metadata for "${appName}". ${subtitleOptions.length} subtitle option(s), ${descriptionOptions.length} description option(s).`,
    subtitleOptions,
    promotionalTextOptions,
    keywordFieldOptions,
    descriptionOptions,
    releaseNotesOptions,
    negativeKeywords,
    githubTask: buildAsoGithubTask(appName, resolvedInput),
  }

  const warnings = collectWarnings(partial)

  return {
    ...partial,
    warnings,
    createdAt: new Date().toISOString(),
  }
}

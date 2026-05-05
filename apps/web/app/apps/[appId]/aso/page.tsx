"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type AsoTextOption = {
  text: string
  charCount: number
}

type AsoKeywordOption = {
  text: string
  charCount: number
  keywords: string[]
}

type AsoDescriptionOption = {
  name: string
  text: string
  charCount: number
}

type GithubTask = {
  title: string
  priority: "low" | "medium" | "high"
  summary: string
  acceptanceCriteria: string[]
  labels?: string[]
}

type AsoResult = {
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

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-blue-900 text-blue-300",
  medium: "bg-yellow-900 text-yellow-300",
  high: "bg-red-900 text-red-300",
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors min-h-[40px]"
    >
      {copied ? "Copied ✓" : label}
    </button>
  )
}

function CharBadge({ count, limit }: { count: number; limit: number }) {
  const ratio = count / limit
  const color =
    ratio >= 1
      ? "text-red-400 bg-red-950 border-red-800"
      : ratio >= 0.9
        ? "text-yellow-400 bg-yellow-950 border-yellow-800"
        : "text-gray-400 bg-gray-900 border-gray-700"
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${color} tabular-nums`}>
      {count}/{limit}
    </span>
  )
}

function exportMarkdown(result: AsoResult): void {
  const lines: string[] = [
    `# ASO Metadata — ${result.appId}`,
    `**Generated:** ${new Date(result.createdAt).toLocaleString()}`,
    "",
    `## Summary`,
    result.summary,
    "",
  ]

  if (result.warnings.length > 0) {
    lines.push("## Warnings")
    result.warnings.forEach((w) => lines.push(`- ⚠️ ${w}`))
    lines.push("")
  }

  lines.push("## Subtitle Options")
  result.subtitleOptions.forEach((o, i) => {
    lines.push(`### Option ${i + 1} (${o.charCount}/30 chars)`)
    lines.push(o.text)
    lines.push("")
  })

  lines.push("## Promotional Text Options")
  result.promotionalTextOptions.forEach((o, i) => {
    lines.push(`### Option ${i + 1} (${o.charCount}/170 chars)`)
    lines.push(o.text)
    lines.push("")
  })

  lines.push("## Keyword Field Options")
  result.keywordFieldOptions.forEach((o, i) => {
    lines.push(`### Option ${i + 1} (${o.charCount}/100 chars)`)
    lines.push(`\`${o.text}\``)
    lines.push("")
  })

  lines.push("## Description Options")
  result.descriptionOptions.forEach((o) => {
    lines.push(`### ${o.name} (${o.charCount}/4000 chars)`)
    lines.push(o.text)
    lines.push("")
  })

  lines.push("## Release Notes Options")
  result.releaseNotesOptions.forEach((o, i) => {
    lines.push(`### Option ${i + 1} (${o.charCount}/4000 chars)`)
    lines.push(o.text)
    lines.push("")
  })

  if (result.negativeKeywords.length > 0) {
    lines.push("## Keywords to Avoid")
    lines.push(result.negativeKeywords.map((k) => `- ${k}`).join("\n"))
    lines.push("")
  }

  lines.push("## GitHub Task")
  lines.push(`### ${result.githubTask.title}`)
  lines.push(`**Priority:** ${result.githubTask.priority}`)
  lines.push("")
  lines.push(result.githubTask.summary)
  lines.push("")
  lines.push("**Acceptance Criteria:**")
  result.githubTask.acceptanceCriteria.forEach((c) => lines.push(`- [ ] ${c}`))
  if (result.githubTask.labels && result.githubTask.labels.length > 0) {
    lines.push("")
    lines.push(`**Labels:** ${result.githubTask.labels.join(", ")}`)
  }

  const md = lines.join("\n")
  const blob = new Blob([md], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `aso-metadata-${result.id}.md`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AsoPage() {
  const params = useParams()
  const appId = params.appId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<AsoResult | null>(null)

  const [appName, setAppName] = useState("")
  const [category, setCategory] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [primaryBenefit, setPrimaryBenefit] = useState("")
  const [differentiators, setDifferentiators] = useState("")
  const [currentSubtitle, setCurrentSubtitle] = useState("")
  const [currentKeywords, setCurrentKeywords] = useState("")
  const [currentPromotionalText, setCurrentPromotionalText] = useState("")
  const [currentDescription, setCurrentDescription] = useState("")
  const [tone, setTone] = useState<"professional" | "direct" | "bold" | "minimal">("professional")
  const [includeNegativeKeywords, setIncludeNegativeKeywords] = useState(false)
  const [localization, setLocalization] = useState<"none" | "starter">("none")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    const differentiatorList = differentiators
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d.length > 0)

    const body = {
      appName: appName || undefined,
      category: category || undefined,
      targetAudience: targetAudience || undefined,
      primaryBenefit: primaryBenefit || undefined,
      differentiators: differentiatorList.length > 0 ? differentiatorList : undefined,
      currentSubtitle: currentSubtitle || undefined,
      currentKeywords: currentKeywords || undefined,
      currentPromotionalText: currentPromotionalText || undefined,
      currentDescription: currentDescription || undefined,
      tone,
      includeNegativeKeywords,
      localization,
    }

    try {
      const res = await fetch(`/api/apps/${appId}/aso/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Request failed")
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate metadata. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/apps/${appId}`} className="text-gray-400 text-sm mb-6 block py-1">
          ← Back to App
        </Link>
        <h1 className="text-2xl font-bold mb-2">ASO Metadata Generator</h1>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Generate App Store subtitles, promotional text, keywords, descriptions, and release notes — all within Apple&apos;s strict character limits.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 mb-10">
          {/* App Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              App Name <span className="text-gray-500 font-normal">(optional — uses profile name if omitted)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="e.g. Focusly"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Category <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="e.g. Productivity, Finance, Health & Fitness"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Target Audience <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="e.g. Indie iOS developers, small business owners"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          {/* Primary Benefit */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Primary Benefit <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="e.g. Ship faster with fewer App Review rejections"
              value={primaryBenefit}
              onChange={(e) => setPrimaryBenefit(e.target.value)}
            />
          </div>

          {/* Differentiators */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Differentiators <span className="text-gray-500 font-normal">(optional — one per line)</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm leading-relaxed"
              placeholder={"Offline-first\nNo account required\nPrivacy focused"}
              value={differentiators}
              onChange={(e) => setDifferentiators(e.target.value)}
            />
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium mb-2">Tone</label>
            <div className="grid grid-cols-2 gap-3">
              {(["professional", "direct", "bold", "minimal"] as const).map((t) => (
                <label
                  key={t}
                  className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${
                    tone === t
                      ? "bg-indigo-900 border-indigo-600 text-indigo-200"
                      : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={t}
                    checked={tone === t}
                    onChange={() => setTone(t)}
                    className="accent-indigo-500"
                  />
                  <span className="text-sm capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Current Metadata (context) */}
          <details className="rounded-xl bg-gray-900 border border-gray-800">
            <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none">
              Current Metadata <span className="text-gray-500 font-normal">(optional — used as context)</span>
            </summary>
            <div className="px-4 pb-4 space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Current Subtitle</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
                  placeholder="max 30 chars"
                  maxLength={30}
                  value={currentSubtitle}
                  onChange={(e) => setCurrentSubtitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Current Keywords</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
                  placeholder="comma-separated, max 100 chars"
                  maxLength={100}
                  value={currentKeywords}
                  onChange={(e) => setCurrentKeywords(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Current Promotional Text</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
                  placeholder="max 170 chars"
                  maxLength={170}
                  value={currentPromotionalText}
                  onChange={(e) => setCurrentPromotionalText(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Current Description</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm leading-relaxed"
                  placeholder="max 4000 chars"
                  maxLength={4000}
                  value={currentDescription}
                  onChange={(e) => setCurrentDescription(e.target.value)}
                />
              </div>
            </div>
          </details>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-gray-900 border border-gray-800">
              <input
                type="checkbox"
                checked={includeNegativeKeywords}
                onChange={(e) => setIncludeNegativeKeywords(e.target.checked)}
                className="accent-indigo-500 w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium">Include negative keywords</p>
                <p className="text-xs text-gray-500">Get a list of keywords to avoid in your metadata</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">Localization</label>
              <div className="grid grid-cols-2 gap-3">
                {(["none", "starter"] as const).map((loc) => (
                  <label
                    key={loc}
                    className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${
                      localization === loc
                        ? "bg-indigo-900 border-indigo-600 text-indigo-200"
                        : "bg-gray-900 border-gray-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="localization"
                      value={loc}
                      checked={localization === loc}
                      onChange={() => setLocalization(loc)}
                      className="accent-indigo-500"
                    />
                    <div>
                      <span className="text-sm capitalize">{loc}</span>
                      {loc === "starter" && (
                        <p className="text-xs text-indigo-300 mt-0.5">Lightweight localization notes</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-medium transition-colors text-base"
          >
            {loading ? "Generating metadata..." : "Generate ASO Metadata →"}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Header + Export */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold">Generated Metadata</h2>
              <button
                onClick={() => exportMarkdown(result)}
                className="shrink-0 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700 min-h-[40px]"
              >
                Export .md
              </button>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-indigo-950 border border-indigo-800">
              <p className="text-sm text-indigo-200">{result.summary}</p>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="p-4 rounded-xl bg-yellow-950 border border-yellow-800">
                <h3 className="text-sm font-semibold text-yellow-300 mb-3">⚠️ Warnings</h3>
                <ul className="space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-yellow-200 flex gap-2">
                      <span className="shrink-0 text-yellow-500">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Subtitles */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-base font-semibold mb-4">Subtitle Options <span className="text-gray-500 text-sm font-normal">max 30 chars</span></h3>
              <div className="space-y-3">
                {result.subtitleOptions.map((opt, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <CharBadge count={opt.charCount} limit={30} />
                      <CopyButton text={opt.text} />
                    </div>
                    <p className="text-sm font-medium">{opt.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotional Text */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-base font-semibold mb-4">Promotional Text Options <span className="text-gray-500 text-sm font-normal">max 170 chars</span></h3>
              <div className="space-y-3">
                {result.promotionalTextOptions.map((opt, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <CharBadge count={opt.charCount} limit={170} />
                      <CopyButton text={opt.text} />
                    </div>
                    <p className="text-sm text-gray-300">{opt.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-base font-semibold mb-4">Keyword Field Options <span className="text-gray-500 text-sm font-normal">max 100 chars</span></h3>
              <div className="space-y-3">
                {result.keywordFieldOptions.map((opt, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <CharBadge count={opt.charCount} limit={100} />
                      <CopyButton text={opt.text} />
                    </div>
                    <p className="text-sm font-mono text-gray-300 break-all">{opt.text}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {opt.keywords.map((kw, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Descriptions */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-base font-semibold mb-4">Description Options <span className="text-gray-500 text-sm font-normal">max 4000 chars</span></h3>
              <div className="space-y-4">
                {result.descriptionOptions.map((opt, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{opt.name}</span>
                        <CharBadge count={opt.charCount} limit={4000} />
                      </div>
                      <CopyButton text={opt.text} />
                    </div>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-950 rounded-lg p-3 max-h-60 overflow-y-auto">
                      {opt.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Release Notes */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-base font-semibold mb-4">Release Notes Options <span className="text-gray-500 text-sm font-normal">max 4000 chars</span></h3>
              <div className="space-y-3">
                {result.releaseNotesOptions.map((opt, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <CharBadge count={opt.charCount} limit={4000} />
                      <CopyButton text={opt.text} />
                    </div>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {opt.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Negative Keywords */}
            {result.negativeKeywords.length > 0 && (
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
                <h3 className="text-base font-semibold mb-3">Keywords to Avoid</h3>
                <div className="flex flex-wrap gap-2">
                  {result.negativeKeywords.map((kw, i) => (
                    <span key={i} className="text-sm px-3 py-1 rounded-full bg-red-950 border border-red-800 text-red-300">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* GitHub Task */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-base font-semibold mb-4">GitHub-Ready Task</h3>
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-sm font-medium leading-snug">{result.githubTask.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[result.githubTask.priority]}`}>
                    {result.githubTask.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{result.githubTask.summary}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Acceptance Criteria</p>
                <ul className="space-y-1 mb-3">
                  {result.githubTask.acceptanceCriteria.map((c, j) => (
                    <li key={j} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-gray-600 shrink-0">□</span>
                      {c}
                    </li>
                  ))}
                </ul>
                {result.githubTask.labels && result.githubTask.labels.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {result.githubTask.labels.map((l, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Localization note */}
            {result && (
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-400">
                <p className="font-medium text-gray-300 mb-1">📋 Next steps</p>
                <p>Copy your preferred options into App Store Connect. Review each field for accuracy before publishing. Character counts are shown — all generated text respects Apple&apos;s limits.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type ReadinessStatus = "ready" | "needs-work" | "blocked"
type RiskLevel = "low" | "medium" | "high"

type ReleasePackageArtifact = {
  type: string
  id: string
  included: boolean
  summary: string
}

type ReleasePackage = {
  id: string
  appId: string
  releaseName: string
  summary: string
  readinessStatus: ReadinessStatus
  riskLevel: RiskLevel
  includedArtifacts: ReleasePackageArtifact[]
  appReviewSubmissionNotes: string
  testFlightChecklist: string[]
  appReviewChecklist: string[]
  storeKitChecklist: string[]
  metadataChecklist: string[]
  blockingIssues: string[]
  recommendedNextActions: string[]
  releasePacketMarkdown: string
  agentExecutionBrief: string
  createdAt: string
}

// ── Small reusable components ─────────────────────────────────────────────────

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
      className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors min-h-[44px] shrink-0"
    >
      {copied ? "Copied ✓" : label}
    </button>
  )
}

function exportMarkdown(pkg: ReleasePackage): void {
  const blob = new Blob([pkg.releasePacketMarkdown], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `release-package-${pkg.id}.md`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-colors ${
        checked ? "bg-indigo-900/40 border-indigo-600" : "bg-gray-900 border-gray-800"
      }`}
    >
      <input
        type="checkbox"
        className="w-5 h-5 accent-indigo-500 mt-0.5 shrink-0"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </label>
  )
}

const READINESS_CONFIG: Record<ReadinessStatus, { label: string; emoji: string; color: string }> =
  {
    ready: { label: "READY", emoji: "✅", color: "text-green-400" },
    "needs-work": { label: "NEEDS WORK", emoji: "⚠️", color: "text-yellow-400" },
    blocked: { label: "BLOCKED", emoji: "🚫", color: "text-red-400" },
  }

const RISK_CONFIG: Record<RiskLevel, { label: string; emoji: string; color: string }> = {
  low: { label: "LOW", emoji: "🟢", color: "text-green-400" },
  medium: { label: "MEDIUM", emoji: "🟡", color: "text-yellow-400" },
  high: { label: "HIGH", emoji: "🔴", color: "text-red-400" },
}

const ARTIFACT_LABELS: Record<string, string> = {
  "release-audit": "Release Audit",
  storekit: "StoreKit Diagnostics",
  "app-review": "App Review Response",
  aso: "ASO Metadata",
  "task-bundle": "GitHub Task Bundle",
}

function ChecklistSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-gray-300">
            <span className="text-gray-600 shrink-0 mt-0.5">□</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReleasePackagePage() {
  const params = useParams()
  const appId = params.appId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pkg, setPkg] = useState<ReleasePackage | null>(null)

  // Artifact toggles
  const [includeLatestAudit, setIncludeLatestAudit] = useState(true)
  const [includeLatestStoreKitSpec, setIncludeLatestStoreKitSpec] = useState(true)
  const [includeLatestAppReviewResponse, setIncludeLatestAppReviewResponse] = useState(true)
  const [includeLatestAsoOutput, setIncludeLatestAsoOutput] = useState(true)
  const [includeLatestTaskBundle, setIncludeLatestTaskBundle] = useState(true)

  // Optional metadata
  const [releaseName, setReleaseName] = useState("")
  const [version, setVersion] = useState("")
  const [buildNumber, setBuildNumber] = useState("")
  const [submissionGoal, setSubmissionGoal] = useState("")
  const [reviewerNotesOverride, setReviewerNotesOverride] = useState("")
  const [internalNotes, setInternalNotes] = useState("")

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setPkg(null)

    const body = {
      includeLatestAudit,
      includeLatestStoreKitSpec,
      includeLatestAppReviewResponse,
      includeLatestAsoOutput,
      includeLatestTaskBundle,
      releaseName: releaseName.trim() || undefined,
      version: version.trim() || undefined,
      buildNumber: buildNumber.trim() || undefined,
      submissionGoal: submissionGoal.trim() || undefined,
      reviewerNotesOverride: reviewerNotesOverride.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
    }

    try {
      const res = await fetch(`/api/apps/${appId}/release/package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Request failed")
      }
      const data = await res.json()
      setPkg(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate release package. Please try again."
      )
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
        <h1 className="text-2xl font-bold mb-2">Release Package</h1>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Combine your latest audit, StoreKit diagnostics, App Review response, ASO metadata, and
          task bundle into one submission-ready release packet.
        </p>

        <form onSubmit={handleGenerate} className="space-y-6 mb-10">
          {/* Artifact toggles */}
          <div>
            <p className="text-sm font-medium mb-3">Include Artifacts</p>
            <div className="grid grid-cols-1 gap-3">
              <ToggleCard
                label="Release Audit"
                description="Risk score, checklists, and blocking issues from your latest release audit."
                checked={includeLatestAudit}
                onChange={setIncludeLatestAudit}
              />
              <ToggleCard
                label="StoreKit Diagnostics"
                description="IAP implementation checklist and reviewer-safe App Review notes."
                checked={includeLatestStoreKitSpec}
                onChange={setIncludeLatestStoreKitSpec}
              />
              <ToggleCard
                label="App Review Response"
                description="Submission notes and reviewer testing instructions from your latest response."
                checked={includeLatestAppReviewResponse}
                onChange={setIncludeLatestAppReviewResponse}
              />
              <ToggleCard
                label="ASO Metadata"
                description="Metadata checklist from your latest ASO metadata generation."
                checked={includeLatestAsoOutput}
                onChange={setIncludeLatestAsoOutput}
              />
              <ToggleCard
                label="GitHub Task Bundle"
                description="Open tasks generated from all available artifact sources."
                checked={includeLatestTaskBundle}
                onChange={setIncludeLatestTaskBundle}
              />
            </div>
          </div>

          {/* Release info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Release Name <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm min-h-[44px]"
                placeholder="e.g. Spring Launch"
                value={releaseName}
                onChange={(e) => setReleaseName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Version <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm min-h-[44px]"
                placeholder="e.g. 2.1.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Build <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm min-h-[44px]"
                placeholder="e.g. 142"
                value={buildNumber}
                onChange={(e) => setBuildNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Optional context fields */}
          <details className="rounded-xl bg-gray-900 border border-gray-800">
            <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none">
              Additional context <span className="text-gray-500 font-normal">(optional)</span>
            </summary>
            <div className="px-4 pb-4 pt-2 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Submission Goal
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm resize-none"
                  rows={2}
                  placeholder="e.g. Launch dark mode and fix the StoreKit rejection from the last submission."
                  value={submissionGoal}
                  onChange={(e) => setSubmissionGoal(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Reviewer Notes Override
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm resize-none"
                  rows={3}
                  placeholder="Override the App Review submission notes. Leave blank to use generated notes."
                  value={reviewerNotesOverride}
                  onChange={(e) => setReviewerNotesOverride(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Internal Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm resize-none"
                  rows={2}
                  placeholder="Internal team notes for this release (not sent to Apple)."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
              </div>
            </div>
          </details>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl font-medium transition-colors text-base min-h-[52px]"
          >
            {loading ? "Generating release package..." : "Generate Release Package →"}
          </button>
        </form>

        {/* Results */}
        {pkg && (
          <div className="space-y-6">
            {/* Status banner */}
            <div
              className={`rounded-xl border p-5 ${
                pkg.readinessStatus === "ready"
                  ? "bg-green-950 border-green-800"
                  : pkg.readinessStatus === "needs-work"
                    ? "bg-yellow-950 border-yellow-800"
                    : "bg-red-950 border-red-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{READINESS_CONFIG[pkg.readinessStatus].emoji}</span>
                    <span
                      className={`font-bold text-lg ${READINESS_CONFIG[pkg.readinessStatus].color}`}
                    >
                      {READINESS_CONFIG[pkg.readinessStatus].label}
                    </span>
                    <span className="text-gray-500">|</span>
                    <span className="text-sm">{RISK_CONFIG[pkg.riskLevel].emoji}</span>
                    <span className={`text-sm font-medium ${RISK_CONFIG[pkg.riskLevel].color}`}>
                      Risk: {RISK_CONFIG[pkg.riskLevel].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{pkg.summary}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {pkg.releaseName} · {new Date(pkg.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Export actions */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h2 className="text-base font-semibold mb-3">Export</h2>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={pkg.releasePacketMarkdown} label="Copy release packet" />
                <CopyButton text={pkg.agentExecutionBrief} label="Copy agent brief" />
                <button
                  onClick={() => exportMarkdown(pkg)}
                  className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors min-h-[44px]"
                >
                  Export .md
                </button>
              </div>
            </div>

            {/* Blocking issues */}
            {pkg.blockingIssues.length > 0 && (
              <div className="p-5 rounded-xl bg-red-950 border border-red-800">
                <h3 className="text-sm font-semibold text-red-300 mb-3">🚫 Blocking Issues</h3>
                <ul className="space-y-2">
                  {pkg.blockingIssues.map((issue, i) => (
                    <li key={i} className="text-sm text-red-200 flex gap-2">
                      <span className="shrink-0 text-red-500">❌</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended next actions */}
            {pkg.recommendedNextActions.length > 0 && (
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Recommended Next Actions
                </h3>
                <ul className="space-y-2">
                  {pkg.recommendedNextActions.map((action, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-3">
                      <span className="text-indigo-500 shrink-0 font-bold">{i + 1}.</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Checklists */}
            <ChecklistSection title="TestFlight Checklist" items={pkg.testFlightChecklist} />
            <ChecklistSection title="App Review Checklist" items={pkg.appReviewChecklist} />
            <ChecklistSection title="StoreKit Checklist" items={pkg.storeKitChecklist} />
            <ChecklistSection title="Metadata Checklist" items={pkg.metadataChecklist} />

            {/* App Review submission notes */}
            {pkg.appReviewSubmissionNotes && (
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold">App Review Submission Notes</h3>
                  <CopyButton text={pkg.appReviewSubmissionNotes} label="Copy" />
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Paste this into the App Review notes field in App Store Connect.
                </p>
                <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-950 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto">
                  {pkg.appReviewSubmissionNotes}
                </div>
              </div>
            )}

            {/* Artifacts */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Artifacts
              </h3>
              <div className="space-y-2">
                {pkg.includedArtifacts.map((artifact, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      artifact.included
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-900 border-gray-800 opacity-60"
                    }`}
                  >
                    <span className="text-base shrink-0">{artifact.included ? "✅" : "❌"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {ARTIFACT_LABELS[artifact.type] ?? artifact.type}
                      </p>
                      <p className="text-xs text-gray-400 break-words">{artifact.summary}</p>
                      {artifact.id && (
                        <p className="text-xs text-gray-600 font-mono mt-0.5">{artifact.id}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Release packet markdown preview */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Release Packet Markdown</h3>
                <div className="flex gap-2">
                  <CopyButton text={pkg.releasePacketMarkdown} label="Copy" />
                  <button
                    onClick={() => exportMarkdown(pkg)}
                    className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors min-h-[44px]"
                  >
                    Export .md
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-950 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto font-mono text-xs">
                {pkg.releasePacketMarkdown}
              </div>
            </div>

            {/* Agent execution brief */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Agent Execution Brief</h3>
                <CopyButton text={pkg.agentExecutionBrief} label="Copy" />
              </div>
              <p className="text-xs text-gray-500 mb-3">
                A single copy-pasteable prompt for a coding agent to finish release-prep work.
              </p>
              <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-950 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                {pkg.agentExecutionBrief}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

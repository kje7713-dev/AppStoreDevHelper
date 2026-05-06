"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import type { ReleasePackage } from "@schemas/release-package"

const READINESS_CONFIG = {
  ready: { label: "READY", emoji: "✅", color: "text-green-400" },
  "needs-work": { label: "NEEDS WORK", emoji: "⚠️", color: "text-yellow-400" },
  blocked: { label: "BLOCKED", emoji: "🚫", color: "text-red-400" },
} as const

const RISK_CONFIG = {
  low: { label: "LOW", emoji: "🟢", color: "text-green-400" },
  medium: { label: "MEDIUM", emoji: "🟡", color: "text-yellow-400" },
  high: { label: "HIGH", emoji: "🔴", color: "text-red-400" },
} as const

const ARTIFACT_LABELS: Record<string, string> = {
  "release-audit": "Release Audit",
  storekit: "StoreKit Diagnostics",
  "app-review": "App Review Response",
  aso: "ASO Metadata",
  "task-bundle": "GitHub Task Bundle",
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg min-h-[44px]"
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

function ChecklistSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">{title}</h3>
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

export default function ReleasePackageResultsByIdPage() {
  const params = useParams()
  const appId = params.appId as string
  const packageId = params.packageId as string
  const [pkg, setPkg] = useState<ReleasePackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/release-packages/${packageId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found")
        return r.json()
      })
      .then((data: ReleasePackage) => {
        setPkg(data)
      })
      .catch(() => setError("Release package not found."))
      .finally(() => setLoading(false))
  }, [packageId])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">Loading release package...</div>
      </main>
    )
  }

  if (!pkg) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-gray-400 mb-4">{error || "Release package not found."}</p>
          <Link href={`/apps/${appId}/release-package`} className="text-indigo-400">
            Generate release package →
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link href={`/apps/${appId}/release-packages`} className="text-gray-400 text-sm block py-1">
          ← Back to Release Package History
        </Link>
        <h1 className="text-2xl font-bold break-words">{pkg.releaseName}</h1>
        <div className="text-sm text-gray-400 space-y-1">
          {pkg.version && <p>Version: {pkg.version}</p>}
          {pkg.buildNumber && <p>Build: {pkg.buildNumber}</p>}
          <p>{new Date(pkg.createdAt).toLocaleString()}</p>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            pkg.readinessStatus === "ready"
              ? "bg-green-950 border-green-800"
              : pkg.readinessStatus === "needs-work"
                ? "bg-yellow-950 border-yellow-800"
                : "bg-red-950 border-red-800"
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-lg">{READINESS_CONFIG[pkg.readinessStatus].emoji}</span>
            <span className={`font-bold ${READINESS_CONFIG[pkg.readinessStatus].color}`}>
              {READINESS_CONFIG[pkg.readinessStatus].label}
            </span>
            <span className="text-gray-500">|</span>
            <span>{RISK_CONFIG[pkg.riskLevel].emoji}</span>
            <span className={`font-medium ${RISK_CONFIG[pkg.riskLevel].color}`}>
              Risk: {RISK_CONFIG[pkg.riskLevel].label}
            </span>
          </div>
          <p className="text-sm text-gray-300">{pkg.summary}</p>
        </div>

        <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
          <h2 className="text-base font-semibold mb-3">Export</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <CopyButton text={pkg.releasePacketMarkdown} label="Copy release packet" />
            <CopyButton text={pkg.agentExecutionBrief} label="Copy agent brief" />
            <button
              onClick={() => exportMarkdown(pkg)}
              className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg min-h-[44px]"
            >
              Export .md
            </button>
          </div>
        </div>

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

        <ChecklistSection title="TestFlight Checklist" items={pkg.testFlightChecklist} />
        <ChecklistSection title="App Review Checklist" items={pkg.appReviewChecklist} />
        <ChecklistSection title="StoreKit Checklist" items={pkg.storeKitChecklist} />
        <ChecklistSection title="Metadata Checklist" items={pkg.metadataChecklist} />

        <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
          <h3 className="text-base font-semibold mb-3">Artifacts</h3>
          <div className="space-y-2">
            {pkg.includedArtifacts.map((artifact, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  artifact.included
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-900 border-gray-800 opacity-70"
                }`}
              >
                <span className="text-base shrink-0">{artifact.included ? "✅" : "❌"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{ARTIFACT_LABELS[artifact.type] ?? artifact.type}</p>
                  <p className="text-xs text-gray-400 break-words">{artifact.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-base font-semibold">Release Packet Markdown</h3>
            <CopyButton text={pkg.releasePacketMarkdown} label="Copy" />
          </div>
          <div className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed bg-gray-950 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto font-mono text-xs">
            {pkg.releasePacketMarkdown}
          </div>
        </div>

        <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-base font-semibold">Agent Execution Brief</h3>
            <CopyButton text={pkg.agentExecutionBrief} label="Copy" />
          </div>
          <div className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed bg-gray-950 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
            {pkg.agentExecutionBrief}
          </div>
        </div>
      </div>
    </main>
  )
}

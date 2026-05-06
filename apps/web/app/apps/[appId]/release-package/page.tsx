"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

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

export default function ReleasePackagePage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [includeLatestAudit, setIncludeLatestAudit] = useState(true)
  const [includeLatestStoreKitSpec, setIncludeLatestStoreKitSpec] = useState(true)
  const [includeLatestAppReviewResponse, setIncludeLatestAppReviewResponse] = useState(true)
  const [includeLatestAsoOutput, setIncludeLatestAsoOutput] = useState(true)
  const [includeLatestTaskBundle, setIncludeLatestTaskBundle] = useState(true)

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
      const data = (await res.json()) as { id: string }
      router.push(`/apps/${appId}/release-package/results/${data.id}`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate release package. Please try again."
      )
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
        <p className="text-gray-400 mb-4 text-sm leading-relaxed">
          Combine your latest audit, StoreKit diagnostics, App Review response, ASO metadata, and
          task bundle into one saved release packet.
        </p>
        <Link
          href={`/apps/${appId}/release-packages`}
          className="inline-block text-sm text-indigo-400 mb-8 py-1"
        >
          View saved package history →
        </Link>

        <form onSubmit={handleGenerate} className="space-y-6">
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

          <details className="rounded-xl bg-gray-900 border border-gray-800">
            <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none">
              Additional context <span className="text-gray-500 font-normal">(optional)</span>
            </summary>
            <div className="px-4 pb-4 pt-2 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Submission Goal</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm resize-none"
                  rows={2}
                  value={submissionGoal}
                  onChange={(e) => setSubmissionGoal(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Reviewer Notes Override</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm resize-none"
                  rows={3}
                  value={reviewerNotesOverride}
                  onChange={(e) => setReviewerNotesOverride(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Internal Notes</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm resize-none"
                  rows={2}
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
      </div>
    </main>
  )
}

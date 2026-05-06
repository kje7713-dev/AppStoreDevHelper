"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type TaskBundleTask = {
  title: string
  priority: "low" | "medium" | "high"
  source: "release-audit" | "storekit" | "app-review" | "aso" | "manual"
  summary: string
  acceptanceCriteria: string[]
  labels: string[]
  markdown: string
}

type TaskBundle = {
  id: string
  appId: string
  summary: string
  taskCount: number
  tasks: TaskBundleTask[]
  bundleMarkdown: string
  agentImplementationBrief: string
  createdAt: string
  warnings: string[]
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-blue-900 text-blue-300",
  medium: "bg-yellow-900 text-yellow-300",
  high: "bg-red-900 text-red-300",
}

const SOURCE_LABELS: Record<string, string> = {
  "release-audit": "Release Audit",
  storekit: "StoreKit",
  "app-review": "App Review",
  aso: "ASO",
  manual: "Manual",
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
      className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors min-h-[44px] shrink-0"
    >
      {copied ? "Copied ✓" : label}
    </button>
  )
}

function exportMarkdown(bundle: TaskBundle): void {
  const blob = new Blob([bundle.bundleMarkdown], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `task-bundle-${bundle.id}.md`
  a.click()
  URL.revokeObjectURL(url)
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
        checked
          ? "bg-indigo-900/40 border-indigo-600"
          : "bg-gray-900 border-gray-800"
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

export default function TaskBundlePage() {
  const params = useParams()
  const appId = params.appId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [bundle, setBundle] = useState<TaskBundle | null>(null)

  // Source toggles
  const [includeReleaseAuditTasks, setIncludeReleaseAuditTasks] = useState(true)
  const [includeStoreKitTasks, setIncludeStoreKitTasks] = useState(true)
  const [includeAppReviewTasks, setIncludeAppReviewTasks] = useState(true)
  const [includeAsoTasks, setIncludeAsoTasks] = useState(true)

  // Optional IDs
  const [releaseAuditId, setReleaseAuditId] = useState("")
  const [storeKitSpecId, setStoreKitSpecId] = useState("")
  const [appReviewResponseId, setAppReviewResponseId] = useState("")
  const [asoOutputId, setAsoOutputId] = useState("")

  // Filters
  const [priorityFloor, setPriorityFloor] = useState<"" | "low" | "medium" | "high">("")
  const [labelPrefix, setLabelPrefix] = useState("")

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setBundle(null)

    const body = {
      includeReleaseAuditTasks,
      includeStoreKitTasks,
      includeAppReviewTasks,
      includeAsoTasks,
      releaseAuditId: releaseAuditId.trim() || undefined,
      storeKitSpecId: storeKitSpecId.trim() || undefined,
      appReviewResponseId: appReviewResponseId.trim() || undefined,
      asoOutputId: asoOutputId.trim() || undefined,
      priorityFloor: priorityFloor || undefined,
      labelPrefix: labelPrefix.trim() || undefined,
    }

    try {
      const res = await fetch(`/api/apps/${appId}/tasks/bundle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Request failed")
      }
      const data = await res.json()
      setBundle(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate task bundle. Please try again."
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
        <h1 className="text-2xl font-bold mb-2">GitHub Task Bundle</h1>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Collect tasks from release audits, StoreKit diagnostics, App Review responses, and ASO
          metadata into a single GitHub-ready export. Uses the latest saved output for each source.
        </p>

        <form onSubmit={handleGenerate} className="space-y-6 mb-10">
          {/* Source toggles */}
          <div>
            <p className="text-sm font-medium mb-3">Include Sources</p>
            <div className="grid grid-cols-1 gap-3">
              <ToggleCard
                label="Release Audit Tasks"
                description="GitHub tasks generated from your latest release audit."
                checked={includeReleaseAuditTasks}
                onChange={setIncludeReleaseAuditTasks}
              />
              <ToggleCard
                label="StoreKit Diagnostics Tasks"
                description="GitHub task from your latest StoreKit diagnostics spec."
                checked={includeStoreKitTasks}
                onChange={setIncludeStoreKitTasks}
              />
              <ToggleCard
                label="App Review Response Tasks"
                description="Internal tasks from your latest App Review response."
                checked={includeAppReviewTasks}
                onChange={setIncludeAppReviewTasks}
              />
              <ToggleCard
                label="ASO Metadata Tasks"
                description="GitHub task from your latest ASO metadata generation."
                checked={includeAsoTasks}
                onChange={setIncludeAsoTasks}
              />
            </div>
          </div>

          {/* Optional specific IDs */}
          <details className="rounded-xl bg-gray-900 border border-gray-800">
            <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none">
              Use specific output IDs <span className="text-gray-500 font-normal">(optional)</span>
            </summary>
            <div className="px-4 pb-4 space-y-3 pt-1">
              <p className="text-xs text-gray-500">
                Leave blank to use the latest saved output for each source.
              </p>
              {[
                {
                  label: "Release Audit ID",
                  value: releaseAuditId,
                  set: setReleaseAuditId,
                  placeholder: "audit UUID",
                },
                {
                  label: "StoreKit Spec ID",
                  value: storeKitSpecId,
                  set: setStoreKitSpecId,
                  placeholder: "spec UUID",
                },
                {
                  label: "App Review Response ID",
                  value: appReviewResponseId,
                  set: setAppReviewResponseId,
                  placeholder: "response UUID",
                },
                {
                  label: "ASO Output ID",
                  value: asoOutputId,
                  set: setAsoOutputId,
                  placeholder: "output UUID",
                },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm font-mono"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </details>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Priority Floor{" "}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <select
                className="w-full px-3 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm min-h-[44px]"
                value={priorityFloor}
                onChange={(e) =>
                  setPriorityFloor(e.target.value as "" | "low" | "medium" | "high")
                }
              >
                <option value="">All priorities</option>
                <option value="low">Low and above</option>
                <option value="medium">Medium and above</option>
                <option value="high">High only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Label Prefix{" "}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm min-h-[44px]"
                placeholder="e.g. appops"
                value={labelPrefix}
                onChange={(e) => setLabelPrefix(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl font-medium transition-colors text-base min-h-[52px]"
          >
            {loading ? "Generating bundle..." : "Generate Task Bundle →"}
          </button>
        </form>

        {/* Results */}
        {bundle && (
          <div className="space-y-6">
            {/* Summary + actions */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-lg font-bold mb-1">Task Bundle</h2>
                  <p className="text-sm text-gray-400">{bundle.summary}</p>
                </div>
                <span className="shrink-0 text-2xl font-bold tabular-nums text-indigo-400">
                  {bundle.taskCount}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={bundle.bundleMarkdown} label="Copy full bundle" />
                <CopyButton text={bundle.agentImplementationBrief} label="Copy agent brief" />
                <button
                  onClick={() => exportMarkdown(bundle)}
                  className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors min-h-[44px]"
                >
                  Export .md
                </button>
              </div>
            </div>

            {/* Warnings */}
            {bundle.warnings.length > 0 && (
              <div className="p-4 rounded-xl bg-yellow-950 border border-yellow-800">
                <h3 className="text-sm font-semibold text-yellow-300 mb-2">⚠️ Warnings</h3>
                <ul className="space-y-1">
                  {bundle.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-yellow-200 flex gap-2">
                      <span className="shrink-0 text-yellow-500">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* No tasks */}
            {bundle.taskCount === 0 && (
              <div className="p-5 rounded-xl bg-gray-900 border border-gray-800 text-center text-gray-400 text-sm">
                No tasks were generated. Run a release audit, StoreKit diagnostics, App Review
                response, or ASO metadata generation first.
              </div>
            )}

            {/* Individual task cards */}
            {bundle.tasks.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-3">
                  Tasks{" "}
                  <span className="text-gray-500 font-normal text-sm">
                    ({bundle.tasks.length})
                  </span>
                </h3>
                <div className="space-y-4">
                  {bundle.tasks.map((task, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-gray-900 border border-gray-800 p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="text-sm font-semibold leading-snug">{task.title}</h4>
                        <CopyButton text={task.markdown} label="Copy issue" />
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority] ?? "bg-gray-800 text-gray-300"}`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                          {SOURCE_LABELS[task.source] ?? task.source}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{task.summary}</p>
                      {task.acceptanceCriteria.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Acceptance Criteria
                          </p>
                          <ul className="space-y-1 mb-3">
                            {task.acceptanceCriteria.map((c, j) => (
                              <li key={j} className="text-sm text-gray-300 flex gap-2">
                                <span className="text-gray-600 shrink-0">□</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {task.labels.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {task.labels.map((l, j) => (
                            <span
                              key={j}
                              className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent brief */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Agent Implementation Brief</h3>
                <CopyButton text={bundle.agentImplementationBrief} label="Copy" />
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-950 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                {bundle.agentImplementationBrief}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

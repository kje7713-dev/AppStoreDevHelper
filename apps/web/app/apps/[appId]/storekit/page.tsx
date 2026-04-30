"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type DiagnosticField = {
  field: string
  description: string
  displayLabel: string
}

type ImplementationChecklistItem = {
  id: string
  category: string
  task: string
  priority: "required" | "recommended" | "conditional"
  rationale: string
}

type GithubTask = {
  title: string
  priority: string
  summary: string
  acceptanceCriteria: string[]
  labels?: string[]
}

type StoreKitDiagnosticsSpec = {
  id: string
  appId: string
  summary: string
  riskLevel: "low" | "medium" | "high"
  requiredDiagnostics: DiagnosticField[]
  reviewerSafeDisplayFields: DiagnosticField[]
  implementationChecklist: ImplementationChecklistItem[]
  appReviewNotes: string
  githubTask: GithubTask
  swiftImplementationNotes: string[]
  createdAt: string
}

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-900 text-green-300 border-green-800",
  medium: "bg-yellow-900 text-yellow-300 border-yellow-800",
  high: "bg-red-900 text-red-300 border-red-800",
}

const PRIORITY_COLORS: Record<string, string> = {
  required: "bg-red-900 text-red-300",
  recommended: "bg-yellow-900 text-yellow-300",
  conditional: "bg-blue-900 text-blue-300",
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-yellow-900 text-yellow-300",
  medium: "bg-orange-900 text-orange-300",
  high: "bg-red-900 text-red-300",
}

function exportMarkdown(spec: StoreKitDiagnosticsSpec): void {
  const checklist = spec.implementationChecklist

  const groupedChecklist: Record<string, ImplementationChecklistItem[]> = {}
  for (const item of checklist) {
    if (!groupedChecklist[item.category]) groupedChecklist[item.category] = []
    groupedChecklist[item.category].push(item)
  }

  const checklistMd = Object.entries(groupedChecklist)
    .map(([cat, items]) => {
      return `### ${cat}\n${items.map((i) => `- [ ] **[${i.priority}]** ${i.task}\n  > ${i.rationale}`).join("\n")}`
    })
    .join("\n\n")

  const md = `# StoreKit Diagnostics Spec

**App ID:** ${spec.appId}
**Risk Level:** ${spec.riskLevel.toUpperCase()}
**Generated:** ${new Date(spec.createdAt).toLocaleString()}

## Summary
${spec.summary}

## App Review Notes
${spec.appReviewNotes}

## Required Diagnostics
These fields must be visible in the reviewer-safe debug panel:

${spec.requiredDiagnostics.map((f) => `- **${f.displayLabel}**: ${f.description}`).join("\n")}

## Reviewer-Safe Debug Panel — All Fields
${spec.reviewerSafeDisplayFields.map((f) => `- **${f.displayLabel}**: ${f.description}`).join("\n")}

## Implementation Checklist
${checklistMd}

## GitHub Task

### ${spec.githubTask.title}
**Priority:** ${spec.githubTask.priority}

${spec.githubTask.summary}

**Acceptance Criteria:**
${spec.githubTask.acceptanceCriteria.map((c) => `- [ ] ${c}`).join("\n")}

${spec.githubTask.labels && spec.githubTask.labels.length > 0 ? `**Labels:** ${spec.githubTask.labels.join(", ")}` : ""}

## Swift Implementation Notes
${spec.swiftImplementationNotes.map((n, i) => `${i + 1}. ${n}`).join("\n")}
`

  const blob = new Blob([md], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `storekit-diagnostics-${spec.id}.md`
  a.click()
  URL.revokeObjectURL(url)
}

export default function StoreKitDiagnosticsPage() {
  const params = useParams()
  const appId = params.appId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [spec, setSpec] = useState<StoreKitDiagnosticsSpec | null>(null)

  const [productIds, setProductIds] = useState("")
  const [usesSubscriptions, setUsesSubscriptions] = useState(false)
  const [usesConsumables, setUsesConsumables] = useState(false)
  const [usesNonConsumables, setUsesNonConsumables] = useState(false)
  const [hasFreeTrial, setHasFreeTrial] = useState(false)
  const [hasIntroOffer, setHasIntroOffer] = useState(false)
  const [restorePurchaseImplemented, setRestorePurchaseImplemented] = useState(false)
  const [paywallLocation, setPaywallLocation] = useState("")
  const [knownStoreKitIssue, setKnownStoreKitIssue] = useState("")
  const [previousAppReviewIssue, setPreviousAppReviewIssue] = useState("")
  const [reviewerTestingPath, setReviewerTestingPath] = useState("")
  const [usesStoreKit2, setUsesStoreKit2] = useState(false)
  const [hasServerReceiptValidation, setHasServerReceiptValidation] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSpec(null)

    const body = {
      productIds: productIds
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      usesSubscriptions,
      usesConsumables,
      usesNonConsumables,
      hasFreeTrial,
      hasIntroOffer,
      restorePurchaseImplemented,
      paywallLocation,
      knownStoreKitIssue: knownStoreKitIssue || undefined,
      previousAppReviewIssue: previousAppReviewIssue || undefined,
      reviewerTestingPath: reviewerTestingPath || undefined,
      usesStoreKit2,
      hasServerReceiptValidation,
    }

    try {
      const res = await fetch(`/api/apps/${appId}/storekit/diagnostics-spec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Request failed")
      }
      const data = await res.json()
      setSpec(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate spec. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const groupedChecklist: Record<string, ImplementationChecklistItem[]> = {}
  if (spec) {
    for (const item of spec.implementationChecklist) {
      if (!groupedChecklist[item.category]) groupedChecklist[item.category] = []
      groupedChecklist[item.category].push(item)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href={`/apps/${appId}`} className="text-gray-400 text-sm hover:text-white mb-6 block">
          ← Back to App
        </Link>
        <h1 className="text-3xl font-bold mb-2">StoreKit Diagnostics</h1>
        <p className="text-gray-400 mb-8">
          Generate a reviewer-safe diagnostics spec, implementation checklist, and GitHub task to help your app pass App Review.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 mb-12">
          {/* Product IDs */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Product IDs <span className="text-gray-500 font-normal">(one per line)</span>
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none font-mono text-sm"
              placeholder={"com.example.app.monthly\ncom.example.app.annual"}
              value={productIds}
              onChange={(e) => setProductIds(e.target.value)}
            />
          </div>

          {/* Purchase Type Checkboxes */}
          <div>
            <p className="text-sm font-medium mb-3">Purchase Types</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Subscriptions", value: usesSubscriptions, set: setUsesSubscriptions },
                { label: "Consumables", value: usesConsumables, set: setUsesConsumables },
                { label: "Non-Consumables", value: usesNonConsumables, set: setUsesNonConsumables },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-indigo-500"
                    checked={value}
                    onChange={(e) => set(e.target.checked)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Offer & Trial Checkboxes */}
          <div>
            <p className="text-sm font-medium mb-3">Offers &amp; Trials</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Free Trial", value: hasFreeTrial, set: setHasFreeTrial },
                { label: "Intro Offer", value: hasIntroOffer, set: setHasIntroOffer },
                { label: "Restore Purchase", value: restorePurchaseImplemented, set: setRestorePurchaseImplemented },
                { label: "Uses StoreKit 2", value: usesStoreKit2, set: setUsesStoreKit2 },
                { label: "Server Receipt Validation", value: hasServerReceiptValidation, set: setHasServerReceiptValidation },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-indigo-500"
                    checked={value}
                    onChange={(e) => set(e.target.checked)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Paywall Location */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Paywall Location <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. Tap the lock icon on the home screen, or Settings → Upgrade"
              value={paywallLocation}
              onChange={(e) => setPaywallLocation(e.target.value)}
            />
          </div>

          {/* Optional Fields */}
          <div>
            <label className="block text-sm font-medium mb-2">Reviewer Testing Path</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Step-by-step instructions for Apple reviewers to test IAP..."
              value={reviewerTestingPath}
              onChange={(e) => setReviewerTestingPath(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Known StoreKit Issue</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Any known StoreKit bugs or edge cases..."
              value={knownStoreKitIssue}
              onChange={(e) => setKnownStoreKitIssue(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Previous App Review Issue</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Paste any previous rejection message related to StoreKit..."
              value={previousAppReviewIssue}
              onChange={(e) => setPreviousAppReviewIssue(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            {loading ? "Generating diagnostics spec..." : "Generate StoreKit Diagnostics Spec →"}
          </button>
        </form>

        {/* Results */}
        {spec && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-bold">Diagnostics Spec</h2>
              <button
                onClick={() => exportMarkdown(spec)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
              >
                Export as Markdown
              </button>
            </div>

            {/* Risk Level + Summary */}
            <div className={`p-5 rounded-xl border ${RISK_COLORS[spec.riskLevel]}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/20">
                  {spec.riskLevel} risk
                </span>
              </div>
              <p className="text-sm">{spec.summary}</p>
            </div>

            {/* App Review Notes */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-lg font-semibold mb-3">App Review Notes</h3>
              <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{spec.appReviewNotes}</div>
            </div>

            {/* Required Diagnostics */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-lg font-semibold mb-3">Required Diagnostics</h3>
              <p className="text-sm text-gray-400 mb-4">These fields must be visible in your reviewer-safe debug panel:</p>
              <ul className="space-y-3">
                {spec.requiredDiagnostics.map((f) => (
                  <li key={f.field} className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{f.displayLabel}</span>
                    <span className="text-xs text-gray-400">{f.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reviewer-Safe Display Fields */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-lg font-semibold mb-1">All Reviewer-Safe Debug Panel Fields</h3>
              <p className="text-sm text-gray-400 mb-4">Full list of fields to surface in the debug panel:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {spec.reviewerSafeDisplayFields.map((f) => (
                  <div key={f.field} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <p className="text-sm font-medium">{f.displayLabel}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Implementation Checklist */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-lg font-semibold mb-4">Implementation Checklist</h3>
              <div className="space-y-6">
                {Object.entries(groupedChecklist).map(([cat, items]) => (
                  <div key={cat}>
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat}</h4>
                    <ul className="space-y-3">
                      {items.map((item) => (
                        <li key={item.id} className="flex items-start gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${PRIORITY_COLORS[item.priority]}`}>
                            {item.priority}
                          </span>
                          <div>
                            <p className="text-sm">{item.task}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.rationale}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* GitHub Task */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-lg font-semibold mb-3">GitHub Task</h3>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{spec.githubTask.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-3 ${SEVERITY_COLORS[spec.githubTask.priority] ?? "bg-gray-800 text-gray-300"}`}>
                  {spec.githubTask.priority}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{spec.githubTask.summary}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Acceptance Criteria</p>
              <ul className="space-y-1 mb-3">
                {spec.githubTask.acceptanceCriteria.map((c, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2">
                    <span className="text-gray-600">□</span> {c}
                  </li>
                ))}
              </ul>
              {spec.githubTask.labels && spec.githubTask.labels.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {spec.githubTask.labels.map((l, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">{l}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Swift Implementation Notes */}
            {spec.swiftImplementationNotes.length > 0 && (
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
                <h3 className="text-lg font-semibold mb-3">Swift Implementation Notes</h3>
                <ol className="space-y-3">
                  {spec.swiftImplementationNotes.map((note, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-300">
                      <span className="text-gray-500 shrink-0">{i + 1}.</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

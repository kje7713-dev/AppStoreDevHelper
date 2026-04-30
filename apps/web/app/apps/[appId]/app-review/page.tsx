"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type GithubTask = {
  title: string
  priority: "low" | "medium" | "high"
  summary: string
  acceptanceCriteria: string[]
  labels?: string[]
}

type AppReviewIssueType =
  | "StoreKit"
  | "Metadata"
  | "Crash"
  | "Login"
  | "Privacy"
  | "Guideline"
  | "Performance"
  | "Other"

type AppReviewResult = {
  id: string
  appId: string
  summary: string
  detectedIssueType: AppReviewIssueType
  riskLevel: "low" | "medium" | "high"
  appReviewResponse: string
  reviewerTestingInstructions: string
  resubmissionNotes: string
  internalTasks: GithubTask[]
  missingInfo: string[]
  createdAt: string
}

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-900 text-green-300 border-green-800",
  medium: "bg-yellow-900 text-yellow-300 border-yellow-800",
  high: "bg-red-900 text-red-300 border-red-800",
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

function exportMarkdown(result: AppReviewResult): void {
  const tasksMd = result.internalTasks
    .map(
      (task) =>
        `### ${task.title}\n**Priority:** ${task.priority}\n\n${task.summary}\n\n**Acceptance Criteria:**\n${task.acceptanceCriteria.map((c) => `- [ ] ${c}`).join("\n")}${task.labels && task.labels.length > 0 ? `\n\n**Labels:** ${task.labels.join(", ")}` : ""}`
    )
    .join("\n\n---\n\n")

  const md = `# App Review Response
**App ID:** ${result.appId}
**Issue Type:** ${result.detectedIssueType}
**Risk Level:** ${result.riskLevel.toUpperCase()}
**Generated:** ${new Date(result.createdAt).toLocaleString()}

## Summary
${result.summary}

## App Review Response
${result.appReviewResponse}

## Reviewer Testing Instructions
${result.reviewerTestingInstructions}

## Resubmission Notes
${result.resubmissionNotes}

## Internal Tasks
${tasksMd}
${result.missingInfo.length > 0 ? `\n## Missing Information\n${result.missingInfo.map((m) => `- ${m}`).join("\n")}` : ""}
`

  const blob = new Blob([md], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `app-review-response-${result.id}.md`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AppReviewPage() {
  const params = useParams()
  const appId = params.appId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<AppReviewResult | null>(null)

  const [rejectionText, setRejectionText] = useState("")
  const [guideline, setGuideline] = useState("")
  const [buildNumber, setBuildNumber] = useState("")
  const [appVersion, setAppVersion] = useState("")
  const [deviceInfo, setDeviceInfo] = useState("")
  const [reviewerIssueSummary, setReviewerIssueSummary] = useState("")
  const [stepsAlreadyTaken, setStepsAlreadyTaken] = useState("")
  const [testingInstructions, setTestingInstructions] = useState("")
  const [demoAccount, setDemoAccount] = useState("")
  const [knownContext, setKnownContext] = useState("")
  const [desiredTone, setDesiredTone] = useState<"professional" | "concise" | "technical" | "firm">("professional")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    const body = {
      rejectionText,
      guideline: guideline || undefined,
      buildNumber: buildNumber || undefined,
      appVersion: appVersion || undefined,
      deviceInfo: deviceInfo || undefined,
      reviewerIssueSummary: reviewerIssueSummary || undefined,
      stepsAlreadyTaken: stepsAlreadyTaken || undefined,
      testingInstructions: testingInstructions || undefined,
      demoAccount: demoAccount || undefined,
      knownContext: knownContext || undefined,
      desiredTone,
    }

    try {
      const res = await fetch(`/api/apps/${appId}/app-review/response`, {
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
      setError(err instanceof Error ? err.message : "Failed to generate response. Please try again.")
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
        <h1 className="text-2xl font-bold mb-2">App Review Response Generator</h1>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Paste the rejection message from Apple, fill in what you know, and get a professional response, reviewer testing instructions, resubmission checklist, and GitHub-ready internal tasks.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 mb-10">
          {/* Rejection Text */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Rejection Message <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={6}
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm leading-relaxed"
              placeholder="Paste the full rejection message from Apple App Review here..."
              value={rejectionText}
              onChange={(e) => setRejectionText(e.target.value)}
            />
          </div>

          {/* Desired Tone */}
          <div>
            <label className="block text-sm font-medium mb-2">Response Tone</label>
            <div className="grid grid-cols-2 gap-3">
              {(["professional", "concise", "technical", "firm"] as const).map((tone) => (
                <label
                  key={tone}
                  className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${
                    desiredTone === tone
                      ? "bg-indigo-900 border-indigo-600 text-indigo-200"
                      : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="desiredTone"
                    value={tone}
                    checked={desiredTone === tone}
                    onChange={() => setDesiredTone(tone)}
                    className="accent-indigo-500"
                  />
                  <span className="text-sm capitalize">{tone}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Guideline */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Guideline Reference <span className="text-gray-500 font-normal">(optional, e.g. Guideline 3.1.1)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="e.g. Guideline 3.1.1 – In-App Purchase"
              value={guideline}
              onChange={(e) => setGuideline(e.target.value)}
            />
          </div>

          {/* Version + Build */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">App Version</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
                placeholder="e.g. 2.1.0"
                value={appVersion}
                onChange={(e) => setAppVersion(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Build Number</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
                placeholder="e.g. 142"
                value={buildNumber}
                onChange={(e) => setBuildNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Device Info */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Device / OS Info <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="e.g. iPhone 14 Pro, iOS 17.4"
              value={deviceInfo}
              onChange={(e) => setDeviceInfo(e.target.value)}
            />
          </div>

          {/* Reviewer Issue Summary */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Summary of the Issue <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="In your own words, what did the reviewer flag?"
              value={reviewerIssueSummary}
              onChange={(e) => setReviewerIssueSummary(e.target.value)}
            />
          </div>

          {/* Steps Already Taken */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Steps Already Taken <span className="text-gray-500 font-normal">(optional but recommended)</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="Describe what you've already fixed or changed before resubmitting..."
              value={stepsAlreadyTaken}
              onChange={(e) => setStepsAlreadyTaken(e.target.value)}
            />
          </div>

          {/* Testing Instructions */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Reviewer Testing Instructions <span className="text-gray-500 font-normal">(optional but recommended)</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="Step-by-step instructions for the Apple reviewer to verify the fix..."
              value={testingInstructions}
              onChange={(e) => setTestingInstructions(e.target.value)}
            />
          </div>

          {/* Demo Account */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Demo Account <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="e.g. demo@example.com / Demo1234"
              value={demoAccount}
              onChange={(e) => setDemoAccount(e.target.value)}
            />
          </div>

          {/* Known Context */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Context <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="Any other context the reviewer should know..."
              value={knownContext}
              onChange={(e) => setKnownContext(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-medium transition-colors text-base"
          >
            {loading ? "Generating response..." : "Generate App Review Response →"}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Header + Export */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold">Generated Response</h2>
              <button
                onClick={() => exportMarkdown(result)}
                className="shrink-0 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700 min-h-[40px]"
              >
                Export .md
              </button>
            </div>

            {/* Summary + Risk */}
            <div className={`p-4 rounded-xl border ${RISK_COLORS[result.riskLevel]}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/20">
                  {result.riskLevel} risk
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 font-medium">
                  {result.detectedIssueType}
                </span>
              </div>
              <p className="text-sm">{result.summary}</p>
            </div>

            {/* Missing Info */}
            {result.missingInfo.length > 0 && (
              <div className="p-4 rounded-xl bg-yellow-950 border border-yellow-800">
                <h3 className="text-sm font-semibold text-yellow-300 mb-3">💡 Strengthen Your Response</h3>
                <ul className="space-y-2">
                  {result.missingInfo.map((info, i) => (
                    <li key={i} className="text-sm text-yellow-200 flex gap-2">
                      <span className="shrink-0 text-yellow-500">•</span>
                      {info}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* App Review Response */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">App Review Response</h3>
                <CopyButton text={result.appReviewResponse} label="Copy" />
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-950 rounded-lg p-4 overflow-x-auto">
                {result.appReviewResponse}
              </div>
            </div>

            {/* Reviewer Testing Instructions */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Reviewer Testing Instructions</h3>
                <CopyButton text={result.reviewerTestingInstructions} label="Copy" />
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-950 rounded-lg p-4 overflow-x-auto">
                {result.reviewerTestingInstructions}
              </div>
            </div>

            {/* Resubmission Notes */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-base font-semibold mb-3">Resubmission Checklist</h3>
              <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {result.resubmissionNotes}
              </div>
            </div>

            {/* Internal Tasks */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h3 className="text-base font-semibold mb-4">GitHub-Ready Internal Tasks</h3>
              <div className="space-y-4">
                {result.internalTasks.map((task, i) => (
                  <div key={i} className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-medium leading-snug">{task.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{task.summary}</p>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Acceptance Criteria</p>
                    <ul className="space-y-1 mb-3">
                      {task.acceptanceCriteria.map((c, j) => (
                        <li key={j} className="text-sm text-gray-300 flex gap-2">
                          <span className="text-gray-600 shrink-0">□</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                    {task.labels && task.labels.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {task.labels.map((l, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type ReleaseIssue = {
  area: string
  severity: "low" | "medium" | "high"
  issue: string
  recommendedFix: string
}

type GithubTask = {
  title: string
  priority: string
  summary: string
  acceptanceCriteria: string[]
  labels?: string[]
}

type ReleaseAudit = {
  id: string
  appId: string
  releaseRiskScore: number
  summary: string
  blockingIssues: ReleaseIssue[]
  checklists: {
    testFlight: string[]
    appReview: string[]
    storeKit?: string[]
  }
  githubTasks: GithubTask[]
  createdAt: string
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-yellow-900 text-yellow-300",
  medium: "bg-orange-900 text-orange-300",
  high: "bg-red-900 text-red-300",
}

const riskColor = (score: number) => {
  if (score < 30) return "text-green-400"
  if (score < 60) return "text-yellow-400"
  return "text-red-400"
}

export default function AuditResultsByIdPage() {
  const params = useParams()
  const appId = params.appId as string
  const auditId = params.auditId as string
  const [audit, setAudit] = useState<ReleaseAudit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAudit() {
      // Yield to event loop before setting state to avoid cascading renders.
      await Promise.resolve()

      const cached = sessionStorage.getItem(`audit-${auditId}`)
      if (cached) {
        try {
          setAudit(JSON.parse(cached))
          setLoading(false)
          return
        } catch {}
      }

      // Fall back to the API (allows bookmarking / sharing)
      try {
        const r = await fetch(`/api/audits/${auditId}`)
        if (!r.ok) throw new Error("Not found")
        const data = (await r.json()) as ReleaseAudit
        setAudit(data)
      } catch {}
      setLoading(false)
    }

    loadAudit()
  }, [auditId])

  function exportMarkdown() {
    if (!audit) return
    const md = `# Release Audit Results

**Risk Score:** ${audit.releaseRiskScore}/100

## Summary
${audit.summary}

## Blocking Issues
${audit.blockingIssues.map((i) => `### [${i.severity.toUpperCase()}] ${i.issue}\n**Area:** ${i.area}\n**Fix:** ${i.recommendedFix}`).join("\n\n")}

## TestFlight Checklist
${audit.checklists.testFlight.map((i) => `- [ ] ${i}`).join("\n")}

## App Review Checklist
${audit.checklists.appReview.map((i) => `- [ ] ${i}`).join("\n")}

${audit.checklists.storeKit ? `## StoreKit Checklist\n${audit.checklists.storeKit.map((i) => `- [ ] ${i}`).join("\n")}` : ""}

## GitHub Tasks
${audit.githubTasks.map((t) => `### ${t.title}\n${t.summary}\n\n**Acceptance Criteria:**\n${t.acceptanceCriteria.map((c) => `- [ ] ${c}`).join("\n")}`).join("\n\n---\n\n")}
`
    const blob = new Blob([md], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `release-audit-${audit.id}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">Loading audit...</div>
      </main>
    )
  }

  if (!audit) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Audit not found.</p>
          <Link href={`/apps/${appId}/audit`} className="text-indigo-400 hover:text-indigo-300">Run an audit →</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link href={`/apps/${appId}/audit`} className="text-gray-400 text-sm hover:text-white mb-2 block">← Run New Audit</Link>
            <h1 className="text-3xl font-bold">Audit Results</h1>
          </div>
          <button
            onClick={exportMarkdown}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
          >
            Export as Markdown
          </button>
        </div>

        {/* Risk Score */}
        <div className="p-6 rounded-xl bg-gray-900 border border-gray-800 mb-6">
          <div className="flex items-center gap-6">
            <div className={`text-6xl font-bold ${riskColor(audit.releaseRiskScore)}`}>
              {audit.releaseRiskScore}
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Release Risk Score</div>
              <p className="text-gray-300">{audit.summary}</p>
            </div>
          </div>
        </div>

        {/* Blocking Issues */}
        {audit.blockingIssues.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Blocking Issues</h2>
            <div className="space-y-3">
              {audit.blockingIssues.map((issue, i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${SEVERITY_COLORS[issue.severity]} shrink-0 mt-0.5`}>
                      {issue.severity}
                    </span>
                    <div>
                      <p className="font-medium">{issue.issue}</p>
                      <p className="text-gray-400 text-sm mt-1">{issue.recommendedFix}</p>
                      <span className="text-xs text-gray-500 mt-1 inline-block">{issue.area}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ChecklistCard title="TestFlight Checklist" items={audit.checklists.testFlight} />
          <ChecklistCard title="App Review Checklist" items={audit.checklists.appReview} />
          {audit.checklists.storeKit && (
            <ChecklistCard title="StoreKit Checklist" items={audit.checklists.storeKit} />
          )}
        </div>

        {/* GitHub Tasks */}
        {audit.githubTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">GitHub Tasks</h2>
            <div className="space-y-4">
              {audit.githubTasks.map((task, i) => (
                <div key={i} className="p-5 rounded-xl bg-gray-900 border border-gray-800">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{task.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${SEVERITY_COLORS[task.priority] ?? "bg-gray-800 text-gray-300"}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{task.summary}</p>
                  <ul className="space-y-1">
                    {task.acceptanceCriteria.map((c, j) => (
                      <li key={j} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-gray-600">□</span> {c}
                      </li>
                    ))}
                  </ul>
                  {task.labels && task.labels.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {task.labels.map((l, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">{l}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set())

  return (
    <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
      <h2 className="font-semibold mb-3">{title}</h2>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              className="flex items-start gap-3 w-full text-left cursor-pointer"
              onClick={() => {
                setChecked(prev => {
                  const next = new Set(prev)
                  if (next.has(i)) next.delete(i)
                  else next.add(i)
                  return next
                })
              }}
              aria-pressed={checked.has(i)}
            >
              <div className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center ${checked.has(i) ? "bg-indigo-600 border-indigo-600" : "border-gray-600"}`}>
                {checked.has(i) && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className={`text-sm ${checked.has(i) ? "line-through text-gray-500" : "text-gray-300"}`}>{item}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

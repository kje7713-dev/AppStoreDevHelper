"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

type ReleaseIssue = {
  severity: string
}

type ReleaseAudit = {
  id: string
  appId: string
  releaseRiskScore: number
  summary: string
  blockingIssues: ReleaseIssue[]
  createdAt: string
}

const riskColor = (score: number) => {
  if (score < 30) return "text-green-400"
  if (score < 60) return "text-yellow-400"
  return "text-red-400"
}

const riskLabel = (score: number) => {
  if (score < 30) return "Low risk"
  if (score < 60) return "Medium risk"
  return "High risk"
}

export default function AuditHistoryPage() {
  const params = useParams()
  const appId = params.appId as string
  const [audits, setAudits] = useState<ReleaseAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/apps/${appId}/audits`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load audits")
        return r.json()
      })
      .then((data: ReleaseAudit[]) => {
        setAudits(Array.isArray(data) ? data : [])
      })
      .catch(() => setError("Failed to load audit history."))
      .finally(() => setLoading(false))
  }, [appId])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/apps/${appId}`} className="text-gray-400 text-sm mb-6 block py-1">
          ← Back to App
        </Link>
        <h1 className="text-2xl font-bold mb-2">Audit History</h1>
        <p className="text-gray-400 text-sm mb-8">All saved release audits for this app, newest first.</p>

        {loading && <div className="text-gray-400">Loading...</div>}

        {error && <div className="text-red-400 text-sm">{error}</div>}

        {!loading && !error && audits.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-4">No audits yet.</p>
            <Link href={`/apps/${appId}/audit`} className="text-indigo-400">
              Run your first release audit →
            </Link>
          </div>
        )}

        {!loading && !error && audits.length > 0 && (
          <div className="space-y-4">
            {audits.map((audit) => {
              const highIssues = audit.blockingIssues.filter((i) => i.severity === "high").length
              const medIssues = audit.blockingIssues.filter((i) => i.severity === "medium").length
              const issueCount = audit.blockingIssues.length
              return (
                <Link
                  key={audit.id}
                  href={`/apps/${appId}/audit/results/${audit.id}`}
                  className="block p-5 rounded-xl border border-gray-800 bg-gray-900 hover:border-indigo-500 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`text-3xl font-bold tabular-nums shrink-0 ${riskColor(audit.releaseRiskScore)}`}>
                      {audit.releaseRiskScore}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-semibold ${riskColor(audit.releaseRiskScore)}`}>
                          {riskLabel(audit.releaseRiskScore)}
                        </span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-xs text-gray-400">
                          {issueCount} {issueCount === 1 ? "issue" : "issues"}
                          {highIssues > 0 && ` (${highIssues} high)`}
                          {medIssues > 0 && highIssues === 0 && ` (${medIssues} medium)`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2 break-words">{audit.summary}</p>
                      <p className="text-xs text-gray-500">{new Date(audit.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="text-gray-600 text-lg shrink-0">›</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-800">
          <Link
            href={`/apps/${appId}/audit`}
            className="block w-full py-3 text-center bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors text-sm"
          >
            Run New Audit →
          </Link>
        </div>
      </div>
    </main>
  )
}

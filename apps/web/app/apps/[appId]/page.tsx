"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

type AppProfile = {
  id: string
  name: string
  platform: string
  bundleId?: string
  appStoreUrl?: string
  category?: string
  targetAudience?: string
  businessModel?: string
  currentMetadata?: {
    subtitle?: string
    promotionalText?: string
    description?: string
    keywords?: string
    releaseNotes?: string
  }
  createdAt: string
  updatedAt: string
}

type LatestAudit = {
  id: string
  releaseRiskScore: number
  summary: string
  blockingIssues: { severity: string }[]
  createdAt: string
}

export default function AppDetailPage() {
  const params = useParams()
  const appId = params.appId as string
  const [app, setApp] = useState<AppProfile | null>(null)
  const [latestAudit, setLatestAudit] = useState<LatestAudit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/apps/${appId}`).then((r) => r.json()),
      fetch(`/api/apps/${appId}/release/audit`)
        .then((r) => r.json())
        .then((audits: LatestAudit[]) => (Array.isArray(audits) && audits.length > 0 ? audits[0] : null))
        .catch(() => null),
    ])
      .then(([appData, auditData]) => {
        setApp(appData)
        setLatestAudit(auditData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [appId])

  const riskColor = (score: number) => {
    if (score < 30) return "text-green-400"
    if (score < 60) return "text-yellow-400"
    return "text-red-400"
  }

  if (loading)
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    )
  if (!app)
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">App not found.</div>
      </main>
    )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/apps" className="text-gray-400 text-sm hover:text-white mb-6 block">
          ← Back to Apps
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{app.name}</h1>
            {app.bundleId && <p className="text-gray-400 mt-1">{app.bundleId}</p>}
            <div className="flex gap-3 mt-3">
              {app.category && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
                  {app.category}
                </span>
              )}
              {app.businessModel && (
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-900 text-indigo-300">
                  {app.businessModel}
                </span>
              )}
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">iOS</span>
            </div>
          </div>
          <Link
            href={`/apps/${appId}/audit`}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            Run Release Audit →
          </Link>
        </div>

        {/* Latest Audit Summary */}
        {latestAudit && (
          <Link
            href={`/apps/${appId}/audit/results/${latestAudit.id}`}
            className="block mb-8 p-5 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-500 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-400">Latest Release Audit</h2>
              <span className="text-xs text-gray-500">
                {new Date(latestAudit.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-3xl font-bold ${riskColor(latestAudit.releaseRiskScore)}`}>
                {latestAudit.releaseRiskScore}
              </span>
              <div>
                <p className="text-sm text-gray-300">{latestAudit.summary}</p>
                {latestAudit.blockingIssues.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {latestAudit.blockingIssues.length} blocking issue
                    {latestAudit.blockingIssues.length !== 1 ? "s" : ""} · View details →
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {app.targetAudience && (
            <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-1">Target Audience</h3>
              <p>{app.targetAudience}</p>
            </div>
          )}
          {app.appStoreUrl && (
            <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-1">App Store URL</h3>
              <a
                href={app.appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 break-all text-sm"
              >
                {app.appStoreUrl}
              </a>
            </div>
          )}
        </div>

        {app.currentMetadata && (
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4">App Store Metadata</h2>
            <div className="space-y-4">
              {app.currentMetadata.subtitle && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Subtitle</h3>
                  <p>{app.currentMetadata.subtitle}</p>
                </div>
              )}
              {app.currentMetadata.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Description</h3>
                  <p className="text-sm whitespace-pre-wrap">{app.currentMetadata.description}</p>
                </div>
              )}
              {app.currentMetadata.keywords && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Keywords</h3>
                  <p className="text-sm">{app.currentMetadata.keywords}</p>
                </div>
              )}
              {app.currentMetadata.promotionalText && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Promotional Text</h3>
                  <p className="text-sm">{app.currentMetadata.promotionalText}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

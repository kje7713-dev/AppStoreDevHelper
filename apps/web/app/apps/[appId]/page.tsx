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

const riskColor = (score: number) => {
  if (score < 30) return "text-green-400"
  if (score < 60) return "text-yellow-400"
  return "text-red-400"
}

type WorkspaceCardProps = {
  href: string
  emoji: string
  title: string
  description: string
  cta: string
  accent?: boolean
}

function WorkspaceCard({ href, emoji, title, description, cta, accent }: WorkspaceCardProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-3 p-5 rounded-xl border transition-colors ${
        accent
          ? "bg-indigo-600 border-indigo-500 hover:bg-indigo-700"
          : "bg-gray-900 border-gray-800 hover:border-indigo-500"
      }`}
    >
      <div className="text-2xl">{emoji}</div>
      <div>
        <h2 className="font-semibold mb-1">{title}</h2>
        <p className={`text-sm ${accent ? "text-indigo-200" : "text-gray-400"}`}>{description}</p>
      </div>
      <span className={`text-sm font-medium mt-auto ${accent ? "text-white" : "text-indigo-400"}`}>{cta} →</span>
    </Link>
  )
}

export default function AppDetailPage() {
  const params = useParams()
  const appId = params.appId as string
  const [app, setApp] = useState<AppProfile | null>(null)
  const [latestAudit, setLatestAudit] = useState<LatestAudit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/apps/${appId}`)
      .then((r) => r.json())
      .then((data) => {
        setApp(data)
        return fetch(`/api/apps/${appId}/audits`)
      })
      .then((r) => r.json())
      .then((audits: LatestAudit[]) => {
        if (Array.isArray(audits) && audits.length > 0) {
          setLatestAudit(audits[0])
        }
      })
      .catch((err) => { console.error("[AppDetailPage] Failed to load app or audits:", err) })
      .finally(() => setLoading(false))
  }, [appId])

  if (loading) return <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center"><div className="text-gray-400">Loading...</div></main>
  if (!app) return <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center"><div className="text-gray-400">App not found.</div></main>

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/apps" className="text-gray-400 text-sm mb-6 block py-1">← Back to Apps</Link>

        {/* App header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold break-words">{app.name}</h1>
          {app.bundleId && <p className="text-gray-400 mt-1 text-sm">{app.bundleId}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {app.category && <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">{app.category}</span>}
            {app.businessModel && <span className="text-xs px-2 py-1 rounded-full bg-indigo-900 text-indigo-300">{app.businessModel}</span>}
            <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">iOS</span>
          </div>
        </div>

        {/* Latest audit summary banner */}
        {latestAudit && (
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Latest Audit</span>
              <Link href={`/apps/${appId}/audit/results/${latestAudit.id}`} className="text-xs text-indigo-400">
                View results →
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-bold tabular-nums ${riskColor(latestAudit.releaseRiskScore)}`}>
                {latestAudit.releaseRiskScore}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-gray-300 mb-1 break-words">{latestAudit.summary}</p>
                <p className="text-xs text-gray-500">{new Date(latestAudit.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Workspace cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <WorkspaceCard
            href={`/apps/${appId}/audit`}
            emoji="🔍"
            title="Release Audit"
            description="Score your release risk and get a prioritized issue list before submission."
            cta="Run audit"
            accent
          />
          <WorkspaceCard
            href={`/apps/${appId}/storekit`}
            emoji="🛒"
            title="StoreKit Diagnostics"
            description="Generate a reviewer-safe diagnostics spec and IAP implementation checklist."
            cta="Open diagnostics"
          />
          <WorkspaceCard
            href={`/apps/${appId}/audits`}
            emoji="📋"
            title="Audit History"
            description="View all saved audits for this app, newest first."
            cta="View history"
          />
          <WorkspaceCard
            href={`/apps/${appId}/api`}
            emoji="⚡"
            title="API Usage"
            description="Copyable cURL examples for every endpoint. Use from scripts or agents."
            cta="View API docs"
          />
        </div>

        {/* App details */}
        <div className="space-y-4">
          {app.targetAudience && (
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Target Audience</h3>
              <p className="text-sm">{app.targetAudience}</p>
            </div>
          )}
          {app.appStoreUrl && (
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">App Store URL</h3>
              <a href={app.appStoreUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 break-all text-sm">{app.appStoreUrl}</a>
            </div>
          )}

          {app.currentMetadata && (
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">App Store Metadata</h2>
              <div className="space-y-4">
                {app.currentMetadata.subtitle && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Subtitle</h3>
                    <p className="text-sm">{app.currentMetadata.subtitle}</p>
                  </div>
                )}
                {app.currentMetadata.description && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Description</h3>
                    <p className="text-sm whitespace-pre-wrap text-gray-300">{app.currentMetadata.description}</p>
                  </div>
                )}
                {app.currentMetadata.keywords && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Keywords</h3>
                    <p className="text-sm text-gray-300">{app.currentMetadata.keywords}</p>
                  </div>
                )}
                {app.currentMetadata.promotionalText && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Promotional Text</h3>
                    <p className="text-sm text-gray-300">{app.currentMetadata.promotionalText}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

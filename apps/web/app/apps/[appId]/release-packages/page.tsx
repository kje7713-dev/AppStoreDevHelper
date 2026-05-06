"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import type { ReleasePackage } from "@schemas/release-package"

const readinessColor: Record<ReleasePackage["readinessStatus"], string> = {
  ready: "text-green-400",
  "needs-work": "text-yellow-400",
  blocked: "text-red-400",
}

const riskColor: Record<ReleasePackage["riskLevel"], string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
}

export default function ReleasePackageHistoryPage() {
  const params = useParams()
  const appId = params.appId as string
  const [packages, setPackages] = useState<ReleasePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/apps/${appId}/release-packages`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load packages")
        return r.json()
      })
      .then((data: ReleasePackage[]) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load release package history."))
      .finally(() => setLoading(false))
  }, [appId])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/apps/${appId}`} className="text-gray-400 text-sm mb-6 block py-1">
          ← Back to App
        </Link>
        <h1 className="text-2xl font-bold mb-2">Release Package History</h1>
        <p className="text-gray-400 text-sm mb-8">
          All saved release packages for this app, newest first.
        </p>

        {loading && <div className="text-gray-400">Loading...</div>}
        {error && <div className="text-red-400 text-sm">{error}</div>}

        {!loading && !error && packages.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-4">No release packages yet.</p>
            <Link href={`/apps/${appId}/release-package`} className="text-indigo-400 py-2 inline-block">
              Generate your first release package →
            </Link>
          </div>
        )}

        {!loading && !error && packages.length > 0 && (
          <div className="space-y-4">
            {packages.map((pkg) => {
              const includedCount = pkg.includedArtifacts.filter((a) => a.included).length
              const issueCount = pkg.blockingIssues.length
              return (
                <Link
                  key={pkg.id}
                  href={`/apps/${appId}/release-package/results/${pkg.id}`}
                  className="block p-5 rounded-xl border border-gray-800 bg-gray-900 min-h-[120px]"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-semibold break-words">{pkg.releaseName}</h2>
                      <span className={`text-xs font-semibold ${readinessColor[pkg.readinessStatus]}`}>
                        {pkg.readinessStatus.toUpperCase()}
                      </span>
                    </div>
                    {(pkg.version || pkg.buildNumber) && (
                      <p className="text-xs text-gray-400">
                        {pkg.version ? `v${pkg.version}` : ""}
                        {pkg.version && pkg.buildNumber ? " · " : ""}
                        {pkg.buildNumber ? `build ${pkg.buildNumber}` : ""}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{new Date(pkg.createdAt).toLocaleString()}</p>
                    <div className="text-sm text-gray-300 break-words">{pkg.summary}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-1 rounded bg-gray-800 ${riskColor[pkg.riskLevel]}`}>
                        Risk: {pkg.riskLevel}
                      </span>
                      <span className="px-2 py-1 rounded bg-gray-800 text-gray-300">
                        Artifacts: {includedCount}
                      </span>
                      <span className="px-2 py-1 rounded bg-gray-800 text-gray-300">
                        Blocking issues: {issueCount}
                      </span>
                    </div>
                    <span className="text-indigo-400 text-sm py-1">Open full packet →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-800">
          <Link
            href={`/apps/${appId}/release-package`}
            className="block w-full py-3 text-center bg-indigo-600 rounded-lg font-medium text-sm min-h-[44px]"
          >
            Generate New Release Package →
          </Link>
        </div>
      </div>
    </main>
  )
}

"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

// Legacy route: /apps/[appId]/audit/results
// Redirects to the most recent audit's ID-based URL, or shows a run-audit prompt.
export default function AuditResultsPage() {
  const params = useParams()
  const appId = params.appId as string
  const router = useRouter()

  useEffect(() => {
    async function redirectToLatest() {
      try {
        const r = await fetch(`/api/apps/${appId}/audits`)
        if (!r.ok) return
        const audits: { id: string }[] = await r.json()
        if (Array.isArray(audits) && audits.length > 0) {
          router.replace(`/apps/${appId}/audit/results/${audits[0].id}`)
        }
      } catch {}
    }
    redirectToLatest()
  }, [appId, router])

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">Loading latest audit...</p>
        <Link href={`/apps/${appId}/audit`} className="text-indigo-400 hover:text-indigo-300">Run a new audit →</Link>
      </div>
    </main>
  )
}

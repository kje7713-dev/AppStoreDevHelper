"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function AuditPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = e.currentTarget
    const data = new FormData(form)

    const body = {
      latestChanges: data.get("latestChanges") as string,
      knownIssues: data.get("knownIssues") || undefined,
      testFlightNotes: data.get("testFlightNotes") || undefined,
      reviewerNotes: data.get("reviewerNotes") || undefined,
      previousRejectionText: data.get("previousRejectionText") || undefined,
    }

    try {
      const res = await fetch(`/api/apps/${appId}/release/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Audit failed")
      const audit = await res.json()
      router.push(`/apps/${appId}/audit/results/${audit.id}`)
    } catch {
      setError("Failed to run audit. Please try again.")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href={`/apps/${appId}`} className="text-gray-400 text-sm hover:text-white mb-6 block">← Back to App</Link>
        <h1 className="text-3xl font-bold mb-2">Release Audit</h1>
        <p className="text-gray-400 mb-8">Tell us about your upcoming release and we&apos;ll analyze the risk.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Latest Changes <span className="text-red-400">*</span>
            </label>
            <textarea
              name="latestChanges"
              required
              rows={4}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Describe the changes in this release..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Known Issues</label>
            <textarea
              name="knownIssues"
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Any known bugs or limitations..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">TestFlight Notes</label>
            <textarea
              name="testFlightNotes"
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Notes for TestFlight testers..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reviewer Notes</label>
            <textarea
              name="reviewerNotes"
              rows={4}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Notes for Apple's review team (login credentials, demo mode, etc.)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Previous Rejection Text</label>
            <textarea
              name="previousRejectionText"
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Paste any previous App Review rejection message..."
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            {loading ? "Analyzing release..." : "Run Release Audit"}
          </button>
        </form>
      </div>
    </main>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type AppProfile = {
  id: string
  name: string
  platform: string
  bundleId?: string
  businessModel?: string
  category?: string
  createdAt: string
}

export default function AppsPage() {
  const [apps, setApps] = useState<AppProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/apps")
      .then((r) => r.json())
      .then((data) => {
        setApps(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-gray-400 text-sm hover:text-white mb-2 block">← Back</Link>
            <h1 className="text-3xl font-bold">Your Apps</h1>
          </div>
          <Link
            href="/apps/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            + New App
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-4">No apps yet.</p>
            <Link href="/apps/new" className="text-indigo-400 hover:text-indigo-300">Create your first app profile →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => (
              <Link
                key={app.id}
                href={`/apps/${app.id}`}
                className="block p-5 rounded-xl border border-gray-800 bg-gray-900 hover:border-indigo-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{app.name}</h2>
                    {app.bundleId && <p className="text-gray-400 text-sm mt-1">{app.bundleId}</p>}
                    <div className="flex gap-3 mt-2">
                      {app.category && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">{app.category}</span>
                      )}
                      {app.businessModel && (
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-900 text-indigo-300">{app.businessModel}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm">{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

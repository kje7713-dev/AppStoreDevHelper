"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"

type ApiKeyRecord = {
  id: string
  label: string
  keyPreview: string
  createdAt: string
  revokedAt?: string
}

type CreatedApiKey = ApiKeyRecord & {
  rawKey: string
}

export default function ApiKeysSettingsPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [label, setLabel] = useState("")
  const [error, setError] = useState("")
  const [newKey, setNewKey] = useState<CreatedApiKey | null>(null)

  async function loadKeys(showLoader = true) {
    try {
      if (showLoader) setLoading(true)
      const res = await fetch("/api/api-keys")
      const data = await res.json()
      setKeys(Array.isArray(data) ? data : [])
    } catch {
      setError("Failed to load API keys.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetch("/api/api-keys")
      .then((res) => res.json())
      .then((data) => {
        if (active) setKeys(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) setError("Failed to load API keys.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setNewKey(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Failed to create API key")
      setNewKey(data)
      setLabel("")
      await loadKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevoke(id: string) {
    setError("")
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error ?? "Failed to revoke API key")
      }
      await loadKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key")
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="text-gray-400 text-sm mb-6 block py-1">
          ← Back
        </Link>

        <h1 className="text-2xl font-bold mb-2">API Keys</h1>
        <p className="text-gray-400 text-sm mb-6">
          Create API keys for scripts and agents. Raw keys are shown once on creation and cannot be recovered later.
        </p>

        {newKey && (
          <div className="rounded-xl border border-green-800 bg-green-950/40 p-4 mb-6">
            <p className="text-xs text-green-300 mb-2 uppercase tracking-wide font-semibold">Save this key now</p>
            <p className="text-sm text-green-100 break-all font-mono">{newKey.rawKey}</p>
          </div>
        )}

        <form onSubmit={handleCreate} className="rounded-xl border border-gray-800 bg-gray-900 p-5 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Key Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. local-agent, ci-script"
              className="w-full px-3 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm min-h-[44px]"
              maxLength={80}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors min-h-[44px] font-medium"
          >
            {submitting ? "Creating..." : "Create API Key"}
          </button>
        </form>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">Existing Keys</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-gray-500">No API keys yet. Endpoints remain open until you create one.</p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => {
                const active = !key.revokedAt
                return (
                  <div key={key.id} className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium break-words">{key.label}</p>
                        <p className="text-xs text-gray-400 font-mono mt-1 break-all">{key.keyPreview}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created {new Date(key.createdAt).toLocaleString()}
                        </p>
                        {!active && key.revokedAt && (
                          <p className="text-xs text-red-400 mt-1">
                            Revoked {new Date(key.revokedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {active ? (
                        <button
                          onClick={() => handleRevoke(key.id)}
                          className="px-3 py-2 text-xs rounded-lg bg-red-900/50 text-red-200 border border-red-800 hover:bg-red-900 transition-colors min-h-[40px] shrink-0"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-400 shrink-0">
                          Revoked
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    </main>
  )
}

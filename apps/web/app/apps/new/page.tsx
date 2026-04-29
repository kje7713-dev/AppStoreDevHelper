"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewAppPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = e.currentTarget
    const data = new FormData(form)

    const body = {
      name: data.get("name") as string,
      platform: "ios",
      bundleId: data.get("bundleId") || undefined,
      appStoreUrl: data.get("appStoreUrl") || undefined,
      category: data.get("category") || undefined,
      targetAudience: data.get("targetAudience") || undefined,
      businessModel: data.get("businessModel") || undefined,
      currentMetadata: {
        subtitle: data.get("subtitle") || undefined,
        description: data.get("description") || undefined,
        keywords: data.get("keywords") || undefined,
        promotionalText: data.get("promotionalText") || undefined,
      },
    }

    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to create app")
      const app = await res.json()
      router.push(`/apps/${app.id}`)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/apps" className="text-gray-400 text-sm hover:text-white mb-6 block">← Back to Apps</Link>
        <h1 className="text-3xl font-bold mb-8">Create App Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">App Name <span className="text-red-400">*</span></label>
            <input
              name="name"
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="My Awesome App"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bundle ID</label>
            <input
              name="bundleId"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="com.example.myapp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Business Model</label>
            <select
              name="businessModel"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select a model</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
              <option value="subscription">Subscription</option>
              <option value="iap">In-App Purchases</option>
              <option value="freemium">Freemium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <input
              name="category"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Productivity, Health & Fitness, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Audience</label>
            <input
              name="targetAudience"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Indie developers, fitness enthusiasts, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">App Store URL</label>
            <input
              name="appStoreUrl"
              type="url"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="https://apps.apple.com/..."
            />
          </div>

          <hr className="border-gray-800" />
          <h2 className="text-lg font-semibold text-gray-300">App Store Metadata</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Subtitle <span className="text-gray-500">(max 30 chars)</span></label>
            <input
              name="subtitle"
              maxLength={30}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Your app's tagline"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              rows={5}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Describe your app..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Keywords <span className="text-gray-500">(max 100 chars, comma-separated)</span></label>
            <input
              name="keywords"
              maxLength={100}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="productivity,tasks,focus"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Promotional Text <span className="text-gray-500">(max 170 chars)</span></label>
            <input
              name="promotionalText"
              maxLength={170}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              placeholder="Limited time: try premium free for 7 days!"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            {loading ? "Creating..." : "Create App Profile"}
          </button>
        </form>
      </div>
    </main>
  )
}

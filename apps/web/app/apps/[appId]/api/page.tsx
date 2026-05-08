"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors border border-gray-600 shrink-0"
      aria-label="Copy to clipboard"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

type EndpointCardProps = {
  method: "GET" | "POST" | "PATCH"
  path: string
  description: string
  curl: string
  note?: string
}

function EndpointCard({ method, path, description, curl, note }: EndpointCardProps) {
  const methodColors: Record<string, string> = {
    GET: "bg-green-900 text-green-300",
    POST: "bg-blue-900 text-blue-300",
    PATCH: "bg-yellow-900 text-yellow-300",
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${methodColors[method]}`}>{method}</span>
          <code className="text-sm text-gray-200 break-all font-mono">{path}</code>
        </div>
        <p className="text-sm text-gray-400">{description}</p>
        {note && (
          <p className="text-xs text-yellow-400 mt-2">⚠️ {note}</p>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">cURL</span>
          <CopyButton text={curl} />
        </div>
        <pre className="text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed bg-gray-950 rounded-lg p-3 border border-gray-800">
          {curl}
        </pre>
      </div>
    </div>
  )
}

export default function ApiDocsPage() {
  const params = useParams()
  const appId = params.appId as string
  const BASE = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  const AUTH_HEADER = `-H "Authorization: Bearer YOUR_API_KEY"`

  const endpoints: EndpointCardProps[] = [
    {
      method: "GET",
      path: "/api/apps",
      description: "List all app profiles.",
      curl: `curl -X GET "${BASE}/api/apps"`,
    },
    {
      method: "POST",
      path: "/api/apps",
      description: "Create a new app profile. Returns the created app with its generated ID.",
      curl: `curl -X POST "${BASE}/api/apps" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My App",
    "platform": "ios",
    "bundleId": "com.example.myapp",
    "businessModel": "subscription"
  }'`,
    },
    {
      method: "GET",
      path: `/api/apps/${appId}`,
      description: "Get the profile for this app.",
      curl: `curl -X GET "${BASE}/api/apps/${appId}"`,
    },
    {
      method: "PATCH",
      path: `/api/apps/${appId}`,
      description: "Update app profile fields. All fields are optional.",
      curl: `curl -X PATCH "${BASE}/api/apps/${appId}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Updated App Name"}'`,
    },
    {
      method: "POST",
      path: `/api/apps/${appId}/release/audit`,
      description: "Run a release audit. Returns a ReleaseAudit object with risk score, issues, checklists, and GitHub tasks.",
      note: "This endpoint calls an AI model. Ensure OPENAI_API_KEY is set in the environment.",
      curl: `curl -X POST "${BASE}/api/apps/${appId}/release/audit" \\
  ${AUTH_HEADER} \\
  -H "Content-Type: application/json" \\
  -d '{
    "latestChanges": "Added dark mode and fixed crash on iOS 17",
    "knownIssues": "None",
    "testFlightNotes": "Focus testing on Settings screen",
    "reviewerNotes": "Use demo@example.com / password123 to log in"
  }'`,
    },
    {
      method: "GET",
      path: `/api/apps/${appId}/audits`,
      description: "List all saved audits for this app, newest first.",
      curl: `curl -X GET "${BASE}/api/apps/${appId}/audits"`,
    },
    {
      method: "GET",
      path: "/api/audits/[auditId]",
      description: "Get a specific audit by its ID. Replace [auditId] with the actual ID from a previous audit response.",
      curl: `curl -X GET "${BASE}/api/audits/AUDIT_ID_HERE"`,
    },
    {
      method: "POST",
      path: `/api/apps/${appId}/storekit/diagnostics-spec`,
      description: "Generate a StoreKit diagnostics spec, reviewer-safe debug panel fields, implementation checklist, and GitHub task.",
      note: "This endpoint calls an AI model. Ensure OPENAI_API_KEY is set in the environment.",
      curl: `curl -X POST "${BASE}/api/apps/${appId}/storekit/diagnostics-spec" \\
  ${AUTH_HEADER} \\
  -H "Content-Type: application/json" \\
  -d '{
    "productIds": ["com.example.app.monthly", "com.example.app.annual"],
    "usesSubscriptions": true,
    "usesConsumables": false,
    "usesNonConsumables": false,
    "hasFreeTrial": true,
    "hasIntroOffer": false,
    "restorePurchaseImplemented": true,
    "paywallLocation": "Tap lock icon on home screen",
    "usesStoreKit2": true,
    "hasServerReceiptValidation": false
  }'`,
    },
    {
      method: "POST",
      path: `/api/apps/${appId}/app-review/response`,
      description: "Generate an App Review rejection response package with reviewer instructions and internal tasks.",
      curl: `curl -X POST "${BASE}/api/apps/${appId}/app-review/response" \\
  ${AUTH_HEADER} \\
  -H "Content-Type: application/json" \\
  -d '{
    "rejectionText": "We could not complete an in-app purchase."
  }'`,
    },
    {
      method: "POST",
      path: `/api/apps/${appId}/aso/generate`,
      description: "Generate ASO metadata options and GitHub-ready implementation tasks.",
      curl: `curl -X POST "${BASE}/api/apps/${appId}/aso/generate" \\
  ${AUTH_HEADER} \\
  -H "Content-Type: application/json" \\
  -d '{
    "appDescription": "Habit tracker for indie makers"
  }'`,
    },
    {
      method: "POST",
      path: `/api/apps/${appId}/tasks/bundle`,
      description: "Generate a GitHub task bundle from saved app outputs.",
      curl: `curl -X POST "${BASE}/api/apps/${appId}/tasks/bundle" \\
  ${AUTH_HEADER} \\
  -H "Content-Type: application/json" \\
  -d '{
    "includeReleaseAuditTasks": true,
    "includeStoreKitTasks": true,
    "includeAppReviewTasks": true,
    "includeAsoTasks": true
  }'`,
    },
    {
      method: "POST",
      path: `/api/apps/${appId}/release/package`,
      description: "Generate a full release package by combining latest saved outputs.",
      curl: `curl -X POST "${BASE}/api/apps/${appId}/release/package" \\
  ${AUTH_HEADER} \\
  -H "Content-Type: application/json" \\
  -d '{
    "includeLatestAudit": true,
    "includeLatestStoreKitSpec": true,
    "includeLatestAppReviewResponse": true,
    "includeLatestAsoOutput": true,
    "includeLatestTaskBundle": true
  }'`,
    },
  ]

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/apps/${appId}`} className="text-gray-400 text-sm mb-6 block py-1">
          ← Back to App
        </Link>

        <h1 className="text-2xl font-bold mb-2">API Usage</h1>
        <p className="text-gray-400 text-sm mb-2">
          Every endpoint below is callable from the command line, a script, or an AI agent. Copy the cURL examples to get started immediately.
        </p>

        <div className="rounded-lg bg-yellow-900/30 border border-yellow-800 px-4 py-3 mb-8">
          <p className="text-xs text-yellow-200 mb-1">
            Agent-facing generation endpoints require:
            {" "}
            <code className="text-yellow-100">Authorization: Bearer YOUR_API_KEY</code>
          </p>
          <p className="text-xs text-yellow-300">
            Create keys at <Link href="/settings/api-keys" className="underline">/settings/api-keys</Link>. If no active keys exist yet, protected endpoints remain open for local bootstrap.
          </p>
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">Endpoints</h2>
        <p className="text-xs text-gray-500 mb-4">
          Replace <code className="text-gray-300">YOUR_API_KEY</code> with a real key from{" "}
          <Link href="/settings/api-keys" className="underline">/settings/api-keys</Link>.
        </p>

        <div className="space-y-6">
          {endpoints.map((ep, i) => (
            <EndpointCard key={i} {...ep} />
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="font-semibold mb-3">Recommended Agent Workflow</h2>
          <ol className="space-y-3 text-sm text-gray-300">
            {[
              "POST /api/apps to create an app profile (or GET /api/apps to find an existing one).",
              `POST /api/apps/${appId}/release/audit with latestChanges to run a release audit.`,
              "Extract the audit ID from the response and store it.",
              `GET /api/audits/[auditId] to fetch the saved audit at any time.`,
              `POST /api/apps/${appId}/storekit/diagnostics-spec to generate StoreKit guidance.`,
              "Parse githubTasks from the audit or spec response to produce GitHub issues.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          See <code className="text-gray-400">docs/agent-api.md</code> in the repository for full agent documentation.
        </p>
      </div>
    </main>
  )
}

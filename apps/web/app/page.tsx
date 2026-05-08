import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">AppOps Agent</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            AI-powered App Store release operations for indie iOS developers. Audit releases, generate metadata, create checklists, and produce GitHub-ready tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/apps/new"
            className="block p-6 rounded-xl border border-gray-800 bg-gray-900 hover:border-indigo-500 transition-colors"
          >
            <div className="text-2xl mb-3">＋</div>
            <h2 className="text-xl font-semibold mb-2">Create App Profile</h2>
            <p className="text-gray-400 text-sm">
              Add your iOS app to get started with release audits and ASO generation.
            </p>
          </Link>

          <Link
            href="/apps"
            className="block p-6 rounded-xl border border-gray-800 bg-gray-900 hover:border-indigo-500 transition-colors"
          >
            <div className="text-2xl mb-3">📱</div>
            <h2 className="text-xl font-semibold mb-2">View Apps</h2>
            <p className="text-gray-400 text-sm">
              Manage your app profiles and run release audits.
            </p>
          </Link>

          <Link
            href="/settings/api-keys"
            className="block p-6 rounded-xl border border-gray-800 bg-gray-900 hover:border-indigo-500 transition-colors md:col-span-2"
          >
            <div className="text-2xl mb-3">🔐</div>
            <h2 className="text-xl font-semibold mb-2">API Keys</h2>
            <p className="text-gray-400 text-sm">
              Create and revoke API keys for agent and script access to protected generation endpoints.
            </p>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-lg bg-gray-900 border border-gray-800">
            <h3 className="font-semibold mb-2 text-indigo-400">Release Audit</h3>
            <p className="text-gray-400 text-sm">Risk score your release and get a prioritized issue list before submission.</p>
          </div>
          <div className="p-5 rounded-lg bg-gray-900 border border-gray-800">
            <h3 className="font-semibold mb-2 text-indigo-400">ASO Generation</h3>
            <p className="text-gray-400 text-sm">Generate optimized App Store metadata including keywords, subtitle, and description.</p>
          </div>
          <div className="p-5 rounded-lg bg-gray-900 border border-gray-800">
            <h3 className="font-semibold mb-2 text-indigo-400">GitHub Tasks</h3>
            <p className="text-gray-400 text-sm">Convert release issues into structured GitHub-ready tasks with acceptance criteria.</p>
          </div>
        </div>
      </div>
    </main>
  )
}

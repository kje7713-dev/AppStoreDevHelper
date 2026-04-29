"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function AuditResultsPage() {
  const params = useParams()
  const appId = params.appId as string
  const router = useRouter()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/apps/${appId}/release/audit`)
      .then((r) => r.json())
      .then((audits: { id: string }[]) => {
        if (Array.isArray(audits) && audits.length > 0) {
          router.replace(`/apps/${appId}/audit/results/${audits[0].id}`)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
  }, [appId, router])

  if (notFound) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No audit results found.</p>
          <Link href={`/apps/${appId}/audit`} className="text-indigo-400 hover:text-indigo-300">
            Run an audit →
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </main>
  )
}

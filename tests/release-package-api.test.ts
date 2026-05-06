import { describe, it, expect } from "vitest"
import { randomUUID } from "crypto"
import { NextRequest } from "next/server"
import { saveApp } from "@web/lib/app-store"
import { POST as createReleasePackage } from "@web/app/api/apps/[appId]/release/package/route"
import { GET as getReleasePackageById } from "@web/app/api/release-packages/[packageId]/route"
import { GET as listReleasePackagesForApp } from "@web/app/api/apps/[appId]/release-packages/route"

function makeApp(appId: string) {
  const now = new Date().toISOString()
  return {
    id: appId,
    name: `Test App ${appId}`,
    platform: "ios" as const,
    createdAt: now,
    updatedAt: now,
  }
}

function makeCreateRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("release package API persistence", () => {
  it("persists generated package and allows fetch by id and list by app", async () => {
    const appId = `app-${randomUUID()}`
    saveApp(makeApp(appId))

    const createReq = makeCreateRequest({
      releaseName: "Saved Package",
      version: "1.2.3",
      buildNumber: "123",
      includeLatestAudit: false,
      includeLatestStoreKitSpec: false,
      includeLatestAppReviewResponse: false,
      includeLatestAsoOutput: false,
      includeLatestTaskBundle: false,
    })

    const createRes = await createReleasePackage(createReq, {
      params: Promise.resolve({ appId }),
    })
    expect(createRes.status).toBe(201)
    const created = (await createRes.json()) as { id: string; appId: string; version?: string }
    expect(created.appId).toBe(appId)
    expect(created.version).toBe("1.2.3")

    const getRes = await getReleasePackageById(new NextRequest("http://localhost"), {
      params: Promise.resolve({ packageId: created.id }),
    })
    expect(getRes.status).toBe(200)
    const fetched = (await getRes.json()) as { id: string }
    expect(fetched.id).toBe(created.id)

    const listRes = await listReleasePackagesForApp(new NextRequest("http://localhost"), {
      params: Promise.resolve({ appId }),
    })
    expect(listRes.status).toBe(200)
    const list = (await listRes.json()) as Array<{ id: string }>
    expect(list.some((p) => p.id === created.id)).toBe(true)
  })

  it("lists newest package first for an app", async () => {
    const appId = `app-${randomUUID()}`
    saveApp(makeApp(appId))

    const firstReq = makeCreateRequest({
      releaseName: "First",
      includeLatestAudit: false,
      includeLatestStoreKitSpec: false,
      includeLatestAppReviewResponse: false,
      includeLatestAsoOutput: false,
      includeLatestTaskBundle: false,
    })
    const firstRes = await createReleasePackage(firstReq, { params: Promise.resolve({ appId }) })
    const first = (await firstRes.json()) as { id: string }

    await new Promise((resolve) => setTimeout(resolve, 5))

    const secondReq = makeCreateRequest({
      releaseName: "Second",
      includeLatestAudit: false,
      includeLatestStoreKitSpec: false,
      includeLatestAppReviewResponse: false,
      includeLatestAsoOutput: false,
      includeLatestTaskBundle: false,
    })
    const secondRes = await createReleasePackage(secondReq, { params: Promise.resolve({ appId }) })
    const second = (await secondRes.json()) as { id: string }

    const listRes = await listReleasePackagesForApp(new NextRequest("http://localhost"), {
      params: Promise.resolve({ appId }),
    })
    const list = (await listRes.json()) as Array<{ id: string }>
    expect(list[0].id).toBe(second.id)
    expect(list.some((p) => p.id === first.id)).toBe(true)
  })

  it("returns 404 for unknown package id", async () => {
    const res = await getReleasePackageById(new NextRequest("http://localhost"), {
      params: Promise.resolve({ packageId: `missing-${randomUUID()}` }),
    })
    expect(res.status).toBe(404)
  })
})

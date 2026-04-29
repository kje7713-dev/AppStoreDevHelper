import { AppProfile, AppMetadata } from "../../schemas/app"
import { randomUUID } from "crypto"

const profiles = new Map<string, AppProfile>()

export function createAppProfile(data: Omit<AppProfile, "id" | "createdAt" | "updatedAt">): AppProfile {
  const now = new Date().toISOString()
  const profile: AppProfile = {
    ...data,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  profiles.set(profile.id, profile)
  return profile
}

export function getAppProfile(id: string): AppProfile | undefined {
  return profiles.get(id)
}

export function listAppProfiles(): AppProfile[] {
  return Array.from(profiles.values())
}

export function updateAppProfile(id: string, data: Partial<Omit<AppProfile, "id" | "createdAt">>): AppProfile | undefined {
  const existing = profiles.get(id)
  if (!existing) return undefined
  const updated: AppProfile = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  }
  profiles.set(id, updated)
  return updated
}

export function deleteAppProfile(id: string): boolean {
  return profiles.delete(id)
}

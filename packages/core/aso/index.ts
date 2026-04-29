import { AppProfile } from "../../schemas/app"

export type AsoOutput = {
  title: string
  subtitle: string
  keywords: string
  promotionalText: string
  description: string
}

export function generateMockAso(app: AppProfile): AsoOutput {
  return {
    title: app.name.slice(0, 30),
    subtitle: `The smart tool for ${app.category ?? "productivity"}`.slice(0, 30),
    keywords: `${app.category ?? "app"},ios,mobile,${app.businessModel ?? "free"}`,
    promotionalText: `Try ${app.name} today — built for ${app.targetAudience ?? "everyone"}.`.slice(0, 170),
    description: `${app.name} is a powerful iOS app designed for ${app.targetAudience ?? "users who want more"}.\n\nKey Features:\n• Intuitive interface\n• Fast and reliable\n• Built for iOS\n\nDownload now and get started in minutes.`,
  }
}

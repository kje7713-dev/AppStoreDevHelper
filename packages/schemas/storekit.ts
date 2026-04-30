import { GithubTask } from "./task"

export type StoreKitDiagnosticsInput = {
  productIds: string[]
  usesSubscriptions: boolean
  usesConsumables: boolean
  usesNonConsumables: boolean
  hasFreeTrial: boolean
  hasIntroOffer: boolean
  restorePurchaseImplemented: boolean
  paywallLocation: string
  knownStoreKitIssue?: string
  previousAppReviewIssue?: string
  reviewerTestingPath?: string
  usesStoreKit2?: boolean
  hasServerReceiptValidation?: boolean
}

export type DiagnosticField = {
  field: string
  description: string
  displayLabel: string
}

export type ImplementationChecklistItem = {
  id: string
  category: string
  task: string
  priority: "required" | "recommended" | "conditional"
  rationale: string
}

export type StoreKitDiagnosticsSpec = {
  id: string
  appId: string
  summary: string
  riskLevel: "low" | "medium" | "high"
  requiredDiagnostics: DiagnosticField[]
  reviewerSafeDisplayFields: DiagnosticField[]
  implementationChecklist: ImplementationChecklistItem[]
  appReviewNotes: string
  githubTask: GithubTask
  swiftImplementationNotes: string[]
  createdAt: string
}

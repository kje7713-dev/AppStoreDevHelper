export type Checklist = {
  id: string
  appId: string
  type: "testFlight" | "appReview" | "storeKit"
  items: ChecklistItem[]
  createdAt: string
}

export type ChecklistItem = {
  id: string
  text: string
  checked: boolean
}

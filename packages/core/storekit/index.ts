import { Checklist, ChecklistItem } from "../../schemas/checklist"
import { randomUUID } from "crypto"

export function generateStoreKitChecklist(appId: string): Checklist {
  const items: ChecklistItem[] = [
    { id: randomUUID(), text: "All subscription products configured in App Store Connect", checked: false },
    { id: randomUUID(), text: "Sandbox test accounts created and tested", checked: false },
    { id: randomUUID(), text: "Restore purchases button implemented and functional", checked: false },
    { id: randomUUID(), text: "Subscription management link present (Settings > Subscriptions)", checked: false },
    { id: randomUUID(), text: "Terms of Service and Privacy Policy URLs set in App Store Connect", checked: false },
    { id: randomUUID(), text: "Free trial logic tested (start, expire, convert)", checked: false },
    { id: randomUUID(), text: "Cancellation and expiry handling implemented", checked: false },
    { id: randomUUID(), text: "Introductory offers tested if applicable", checked: false },
    { id: randomUUID(), text: "Receipt validation implemented (server-side or StoreKit 2)", checked: false },
    { id: randomUUID(), text: "Paywall includes required subscription disclosure text", checked: false },
  ]

  return {
    id: randomUUID(),
    appId,
    type: "storeKit",
    items,
    createdAt: new Date().toISOString(),
  }
}

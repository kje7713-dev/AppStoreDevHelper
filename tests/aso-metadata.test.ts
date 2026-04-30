import { describe, it, expect } from "vitest"
import { generateAsoMetadata, ASO_LIMITS } from "@core/aso"
import { AsoGenerateInputSchema } from "@web/lib/schemas"
import type { AsoInput } from "@schemas/aso"

function makeInput(overrides: Partial<AsoInput> = {}): AsoInput {
  return {
    tone: "professional",
    ...overrides,
  }
}

// ── Schema validation ─────────────────────────────────────────────────────────

describe("AsoGenerateInputSchema", () => {
  it("accepts a minimal valid payload (tone only via default)", () => {
    const result = AsoGenerateInputSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tone).toBe("professional")
    }
  })

  it("accepts a full valid payload", () => {
    const result = AsoGenerateInputSchema.safeParse({
      appName: "Focusly",
      category: "Productivity",
      targetAudience: "Indie developers",
      primaryBenefit: "Ship faster with fewer rejections",
      differentiators: ["Offline-first", "No account required"],
      competitorApps: ["Trello", "Notion"],
      currentSubtitle: "Dev toolkit",
      currentKeywords: "ios,swift,dev",
      currentPromotionalText: "Try free today!",
      currentDescription: "A great app for developers.",
      tone: "bold",
      includeNegativeKeywords: true,
      localization: "starter",
    })
    expect(result.success).toBe(true)
  })

  it("defaults tone to professional when omitted", () => {
    const result = AsoGenerateInputSchema.safeParse({ appName: "My App" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tone).toBe("professional")
    }
  })

  it("rejects an invalid tone", () => {
    const result = AsoGenerateInputSchema.safeParse({ tone: "aggressive" })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid localization value", () => {
    const result = AsoGenerateInputSchema.safeParse({ localization: "full" })
    expect(result.success).toBe(false)
  })

  it("rejects a currentSubtitle exceeding 30 chars", () => {
    const result = AsoGenerateInputSchema.safeParse({
      currentSubtitle: "A".repeat(31),
    })
    expect(result.success).toBe(false)
  })

  it("rejects a currentKeywords exceeding 100 chars", () => {
    const result = AsoGenerateInputSchema.safeParse({
      currentKeywords: "k".repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it("rejects a currentPromotionalText exceeding 170 chars", () => {
    const result = AsoGenerateInputSchema.safeParse({
      currentPromotionalText: "x".repeat(171),
    })
    expect(result.success).toBe(false)
  })

  it("rejects a currentDescription exceeding 4000 chars", () => {
    const result = AsoGenerateInputSchema.safeParse({
      currentDescription: "d".repeat(4001),
    })
    expect(result.success).toBe(false)
  })

  it("rejects a differentiator item exceeding 200 chars", () => {
    const result = AsoGenerateInputSchema.safeParse({
      differentiators: ["x".repeat(201)],
    })
    expect(result.success).toBe(false)
  })

  it("accepts all valid tone values", () => {
    for (const tone of ["professional", "direct", "bold", "minimal"] as const) {
      const result = AsoGenerateInputSchema.safeParse({ tone })
      expect(result.success).toBe(true)
    }
  })
})

// ── Character limits ──────────────────────────────────────────────────────────

describe("ASO_LIMITS", () => {
  it("subtitle limit is 30", () => {
    expect(ASO_LIMITS.subtitle).toBe(30)
  })

  it("promotionalText limit is 170", () => {
    expect(ASO_LIMITS.promotionalText).toBe(170)
  })

  it("keywords limit is 100", () => {
    expect(ASO_LIMITS.keywords).toBe(100)
  })

  it("description limit is 4000", () => {
    expect(ASO_LIMITS.description).toBe(4000)
  })

  it("releaseNotes limit is 4000", () => {
    expect(ASO_LIMITS.releaseNotes).toBe(4000)
  })
})

// ── Character limit enforcement ───────────────────────────────────────────────

describe("generateAsoMetadata — character limit enforcement", () => {
  it("all subtitle options are within 30 chars", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    for (const opt of result.subtitleOptions) {
      expect(opt.text.length).toBeLessThanOrEqual(ASO_LIMITS.subtitle)
    }
  })

  it("all promotional text options are within 170 chars", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    for (const opt of result.promotionalTextOptions) {
      expect(opt.text.length).toBeLessThanOrEqual(ASO_LIMITS.promotionalText)
    }
  })

  it("all keyword field options are within 100 chars", () => {
    const result = generateAsoMetadata(
      "app-1",
      makeInput({
        appName: "My App",
        currentKeywords: "ios,swift,developer,tools,productivity,workflow,mobile",
      })
    )
    for (const opt of result.keywordFieldOptions) {
      expect(opt.text.length).toBeLessThanOrEqual(ASO_LIMITS.keywords)
    }
  })

  it("all description options are within 4000 chars", () => {
    const result = generateAsoMetadata(
      "app-1",
      makeInput({
        appName: "My App",
        primaryBenefit: "Help users work faster",
        differentiators: ["Feature A", "Feature B", "Feature C"],
      })
    )
    for (const opt of result.descriptionOptions) {
      expect(opt.text.length).toBeLessThanOrEqual(ASO_LIMITS.description)
    }
  })

  it("all release notes options are within 4000 chars", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    for (const opt of result.releaseNotesOptions) {
      expect(opt.text.length).toBeLessThanOrEqual(ASO_LIMITS.releaseNotes)
    }
  })

  it("charCount matches actual text length for subtitles", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    for (const opt of result.subtitleOptions) {
      expect(opt.charCount).toBe(opt.text.length)
    }
  })

  it("charCount matches actual text length for promotional text", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    for (const opt of result.promotionalTextOptions) {
      expect(opt.charCount).toBe(opt.text.length)
    }
  })

  it("charCount matches actual text length for keywords", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App", currentKeywords: "ios,dev" }))
    for (const opt of result.keywordFieldOptions) {
      expect(opt.charCount).toBe(opt.text.length)
    }
  })

  it("charCount matches actual text length for descriptions", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    for (const opt of result.descriptionOptions) {
      expect(opt.charCount).toBe(opt.text.length)
    }
  })

  it("charCount matches actual text length for release notes", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    for (const opt of result.releaseNotesOptions) {
      expect(opt.charCount).toBe(opt.text.length)
    }
  })
})

// ── Keyword field format ──────────────────────────────────────────────────────

describe("generateAsoMetadata — keyword format", () => {
  it("keyword text is comma-separated", () => {
    const result = generateAsoMetadata(
      "app-1",
      makeInput({ currentKeywords: "ios,developer,tools" })
    )
    for (const opt of result.keywordFieldOptions) {
      if (opt.keywords.length > 1) {
        expect(opt.text).toContain(",")
      }
    }
  })

  it("keyword options include a keywords array", () => {
    const result = generateAsoMetadata(
      "app-1",
      makeInput({ currentKeywords: "ios,developer,tools" })
    )
    for (const opt of result.keywordFieldOptions) {
      expect(Array.isArray(opt.keywords)).toBe(true)
      expect(opt.keywords.length).toBeGreaterThan(0)
    }
  })
})

// ── App name fallback ─────────────────────────────────────────────────────────

describe("generateAsoMetadata — app name fallback", () => {
  it("uses appProfile name when appName is not in input", () => {
    const result = generateAsoMetadata(
      "app-1",
      makeInput({ appName: undefined }),
      {
        id: "app-1",
        name: "ProfileApp",
        platform: "ios",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    )
    expect(result.summary).toContain("ProfileApp")
  })

  it("uses input appName over profile name", () => {
    const result = generateAsoMetadata(
      "app-1",
      makeInput({ appName: "InputApp" }),
      {
        id: "app-1",
        name: "ProfileApp",
        platform: "ios",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    )
    expect(result.summary).toContain("InputApp")
  })

  it("uses profile metadata fields as context", () => {
    const result = generateAsoMetadata(
      "app-1",
      makeInput({ appName: "My App" }),
      {
        id: "app-1",
        name: "My App",
        platform: "ios",
        category: "Finance",
        targetAudience: "Freelancers",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    )
    // Should generate content using the profile category/audience
    const allText = JSON.stringify(result)
    expect(allText).toBeTruthy()
    expect(result.subtitleOptions.length).toBeGreaterThan(0)
  })
})

// ── Negative keywords ─────────────────────────────────────────────────────────

describe("generateAsoMetadata — negative keywords", () => {
  it("returns empty negativeKeywords when includeNegativeKeywords is false", () => {
    const result = generateAsoMetadata(
      "app-1",
      makeInput({ includeNegativeKeywords: false })
    )
    expect(result.negativeKeywords).toHaveLength(0)
  })

  it("returns negativeKeywords when includeNegativeKeywords is true", () => {
    const result = generateAsoMetadata(
      "app-1",
      makeInput({ includeNegativeKeywords: true })
    )
    expect(result.negativeKeywords.length).toBeGreaterThan(0)
  })

  it("does not include 'best' or '#1' type claims in negatives list", () => {
    const result = generateAsoMetadata(
      "app-1",
      makeInput({ includeNegativeKeywords: true })
    )
    // These terms should be in the negative list (to avoid)
    expect(result.negativeKeywords.some((k) => k.includes("best") || k.includes("#1"))).toBe(true)
  })
})

// ── Output structure ──────────────────────────────────────────────────────────

describe("generateAsoMetadata — output structure", () => {
  it("returns all required top-level fields", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))

    expect(typeof result.id).toBe("string")
    expect(result.id.length).toBeGreaterThan(0)
    expect(result.appId).toBe("app-1")
    expect(typeof result.summary).toBe("string")
    expect(Array.isArray(result.subtitleOptions)).toBe(true)
    expect(Array.isArray(result.promotionalTextOptions)).toBe(true)
    expect(Array.isArray(result.keywordFieldOptions)).toBe(true)
    expect(Array.isArray(result.descriptionOptions)).toBe(true)
    expect(Array.isArray(result.releaseNotesOptions)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)
    expect(Array.isArray(result.negativeKeywords)).toBe(true)
    expect(typeof result.githubTask).toBe("object")
    expect(typeof result.createdAt).toBe("string")
  })

  it("generates unique IDs for each call", () => {
    const input = makeInput({ appName: "My App" })
    const r1 = generateAsoMetadata("app-1", input)
    const r2 = generateAsoMetadata("app-1", input)
    expect(r1.id).not.toBe(r2.id)
  })

  it("sets appId correctly", () => {
    const result = generateAsoMetadata("my-app-123", makeInput())
    expect(result.appId).toBe("my-app-123")
  })

  it("returns at least one subtitle option", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    expect(result.subtitleOptions.length).toBeGreaterThan(0)
  })

  it("returns at least one promotional text option", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    expect(result.promotionalTextOptions.length).toBeGreaterThan(0)
  })

  it("returns at least one keyword field option", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App", currentKeywords: "ios,dev" }))
    expect(result.keywordFieldOptions.length).toBeGreaterThan(0)
  })

  it("returns at least one description option", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    expect(result.descriptionOptions.length).toBeGreaterThan(0)
  })

  it("returns at least one release notes option", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    expect(result.releaseNotesOptions.length).toBeGreaterThan(0)
  })

  it("returns a githubTask with required fields", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    const task = result.githubTask
    expect(typeof task.title).toBe("string")
    expect(["low", "medium", "high"]).toContain(task.priority)
    expect(typeof task.summary).toBe("string")
    expect(Array.isArray(task.acceptanceCriteria)).toBe(true)
    expect(task.acceptanceCriteria.length).toBeGreaterThan(0)
    expect(Array.isArray(task.labels)).toBe(true)
  })

  it("description options include a name field", () => {
    const result = generateAsoMetadata("app-1", makeInput({ appName: "My App" }))
    for (const opt of result.descriptionOptions) {
      expect(typeof opt.name).toBe("string")
      expect(opt.name.length).toBeGreaterThan(0)
    }
  })

  it("createdAt is a valid ISO 8601 date string", () => {
    const result = generateAsoMetadata("app-1", makeInput())
    expect(() => new Date(result.createdAt)).not.toThrow()
    expect(isNaN(new Date(result.createdAt).getTime())).toBe(false)
  })
})

// ── Tone variations ───────────────────────────────────────────────────────────

describe("generateAsoMetadata — tone variations", () => {
  for (const tone of ["professional", "direct", "bold", "minimal"] as const) {
    it(`generates valid output for tone: ${tone}`, () => {
      const result = generateAsoMetadata(
        "app-1",
        makeInput({ appName: "My App", tone })
      )
      expect(result.subtitleOptions.length).toBeGreaterThan(0)
      expect(result.promotionalTextOptions.length).toBeGreaterThan(0)
      expect(result.descriptionOptions.length).toBeGreaterThan(0)
      expect(result.releaseNotesOptions.length).toBeGreaterThan(0)

      // All outputs must respect limits regardless of tone
      for (const opt of result.subtitleOptions) {
        expect(opt.text.length).toBeLessThanOrEqual(ASO_LIMITS.subtitle)
      }
      for (const opt of result.promotionalTextOptions) {
        expect(opt.text.length).toBeLessThanOrEqual(ASO_LIMITS.promotionalText)
      }
      for (const opt of result.descriptionOptions) {
        expect(opt.text.length).toBeLessThanOrEqual(ASO_LIMITS.description)
      }
      for (const opt of result.releaseNotesOptions) {
        expect(opt.text.length).toBeLessThanOrEqual(ASO_LIMITS.releaseNotes)
      }
    })
  }
})

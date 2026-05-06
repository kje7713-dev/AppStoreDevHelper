import { randomUUID } from "crypto"
import { GithubTask } from "../../schemas/task"
import { ReleaseIssue } from "../../schemas/release"
import type {
  TaskBundleInput,
  TaskBundle,
  TaskBundleTask,
  TaskBundleSources,
  TaskSource,
} from "../../schemas/task-bundle"

export function issuesToGithubTasks(issues: ReleaseIssue[]): GithubTask[] {
  return issues.map((issue) => ({
    title: `[${issue.area}] ${issue.issue}`,
    priority: issue.severity,
    summary: issue.recommendedFix,
    acceptanceCriteria: [
      `The following issue is resolved: ${issue.issue}`,
      `Verified in TestFlight or staging environment`,
    ],
    labels: ["app-store", issue.area.toLowerCase(), issue.severity],
  }))
}

export function tasksToMarkdown(tasks: GithubTask[]): string {
  return tasks
    .map(
      (task) => `## ${task.title}

**Priority:** ${task.priority}

${task.summary}

### Acceptance Criteria
${task.acceptanceCriteria.map((c) => `- [ ] ${c}`).join("\n")}

**Labels:** ${(task.labels ?? []).join(", ")}
`
    )
    .join("\n---\n\n")
}

// ── Task bundle generation ─────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<"low" | "medium" | "high", number> = {
  low: 0,
  medium: 1,
  high: 2,
}

function meetsFloor(
  priority: "low" | "medium" | "high",
  floor: "low" | "medium" | "high" | undefined
): boolean {
  if (!floor) return true
  return PRIORITY_ORDER[priority] >= PRIORITY_ORDER[floor]
}

function applyLabelPrefix(labels: string[], prefix: string | undefined): string[] {
  if (!prefix) return labels
  return labels.map((l) => `${prefix}/${l}`)
}

function taskToMarkdown(task: TaskBundleTask): string {
  const lines: string[] = []
  lines.push(`## ${task.title}`)
  lines.push("")
  lines.push(`**Priority:** ${task.priority}  **Source:** ${task.source}`)
  lines.push("")
  lines.push(task.summary)
  lines.push("")
  lines.push("### Acceptance Criteria")
  for (const c of task.acceptanceCriteria) {
    lines.push(`- [ ] ${c}`)
  }
  lines.push("")
  if (task.labels.length > 0) {
    lines.push(`**Labels:** ${task.labels.join(", ")}`)
  }
  return lines.join("\n")
}

function buildAgentBrief(
  appId: string,
  tasks: TaskBundleTask[],
  input: TaskBundleInput
): string {
  const lines: string[] = []
  const sources = [...new Set(tasks.map((t) => t.source))].join(", ")

  lines.push("## Agent Implementation Brief")
  lines.push("")
  lines.push(
    `You are implementing ${tasks.length} GitHub issue(s) for app \`${appId}\`. Sources: ${sources || "none"}.`
  )
  lines.push("")

  if (input.priorityFloor) {
    lines.push(`Only tasks with priority \`${input.priorityFloor}\` or higher are included.`)
    lines.push("")
  }

  if (input.labelPrefix) {
    lines.push(`All labels are prefixed with \`${input.labelPrefix}/\`.`)
    lines.push("")
  }

  lines.push("### Tasks")
  lines.push("")

  for (const task of tasks) {
    lines.push(`#### ${task.title}`)
    lines.push(`- **Priority:** ${task.priority}`)
    lines.push(`- **Source:** ${task.source}`)
    lines.push(`- **Summary:** ${task.summary}`)
    if (task.acceptanceCriteria.length > 0) {
      lines.push("- **Acceptance Criteria:**")
      for (const c of task.acceptanceCriteria) {
        lines.push(`  - [ ] ${c}`)
      }
    }
    if (task.labels.length > 0) {
      lines.push(`- **Labels:** ${task.labels.join(", ")}`)
    }
    lines.push("")
  }

  lines.push("### Implementation Guidelines")
  lines.push("")
  lines.push("1. Address all `high` priority tasks first, then `medium`, then `low`.")
  lines.push("2. For each task, verify every acceptance criterion before marking it complete.")
  lines.push("3. Create one GitHub issue per task using the markdown in `tasks[].markdown`.")
  lines.push("4. Apply the labels listed on each task when creating the issue.")
  lines.push("5. Run all existing tests before and after each change.")
  lines.push("6. Do not create GitHub issues automatically — paste the markdown manually or via the GitHub API.")

  return lines.join("\n")
}

export function generateTaskBundle(
  appId: string,
  input: TaskBundleInput,
  sources: TaskBundleSources
): TaskBundle {
  const warnings: string[] = []
  const allTasks: TaskBundleTask[] = []

  function addTasks(
    source: TaskSource,
    tasks: GithubTask[],
    sourceName: string
  ) {
    if (tasks.length === 0) {
      warnings.push(`${sourceName} has no tasks to include.`)
      return
    }
    for (const task of tasks) {
      if (!meetsFloor(task.priority, input.priorityFloor)) continue
      const labels = applyLabelPrefix(task.labels ?? [], input.labelPrefix)
      const bundleTask: TaskBundleTask = {
        title: task.title,
        priority: task.priority,
        source,
        summary: task.summary,
        acceptanceCriteria: task.acceptanceCriteria,
        labels,
        markdown: "",
      }
      bundleTask.markdown = taskToMarkdown(bundleTask)
      allTasks.push(bundleTask)
    }
  }

  // Release audit tasks
  if (input.includeReleaseAuditTasks) {
    if (!sources.releaseAudit) {
      warnings.push("No release audit found for this app. Skipping release audit tasks.")
    } else {
      addTasks("release-audit", sources.releaseAudit.githubTasks, "Release audit")
    }
  }

  // StoreKit tasks
  if (input.includeStoreKitTasks) {
    if (!sources.storeKitSpec) {
      warnings.push("No StoreKit diagnostics spec found for this app. Skipping StoreKit tasks.")
    } else {
      addTasks("storekit", [sources.storeKitSpec.githubTask], "StoreKit spec")
    }
  }

  // App Review tasks
  if (input.includeAppReviewTasks) {
    if (!sources.appReviewResponse) {
      warnings.push("No App Review response found for this app. Skipping App Review tasks.")
    } else {
      addTasks("app-review", sources.appReviewResponse.internalTasks, "App Review response")
    }
  }

  // ASO tasks
  if (input.includeAsoTasks) {
    if (!sources.asoOutput) {
      warnings.push("No ASO metadata output found for this app. Skipping ASO tasks.")
    } else {
      addTasks("aso", [sources.asoOutput.githubTask], "ASO output")
    }
  }

  // Deduplicate by normalized title
  const seen = new Set<string>()
  const dedupedTasks: TaskBundleTask[] = []
  for (const task of allTasks) {
    const key = task.title.toLowerCase().replace(/\s+/g, " ").trim()
    if (!seen.has(key)) {
      seen.add(key)
      dedupedTasks.push(task)
    }
  }

  const uniqueSources = [...new Set(dedupedTasks.map((t) => t.source))]

  const summary =
    dedupedTasks.length === 0
      ? `No tasks generated.${warnings.length > 0 ? ` ${warnings.length} warning(s).` : ""}`
      : `${dedupedTasks.length} task(s) from ${uniqueSources.join(", ")}.${warnings.length > 0 ? ` ${warnings.length} warning(s).` : ""}`

  const bundleMarkdown =
    dedupedTasks.length > 0
      ? `# GitHub Task Bundle\n\n_Generated ${new Date().toISOString()} · App: ${appId}_\n\n---\n\n${dedupedTasks.map((t) => t.markdown).join("\n\n---\n\n")}`
      : `# GitHub Task Bundle\n\n_No tasks generated._`

  const agentImplementationBrief = buildAgentBrief(appId, dedupedTasks, input)

  return {
    id: randomUUID(),
    appId,
    summary,
    taskCount: dedupedTasks.length,
    tasks: dedupedTasks,
    bundleMarkdown,
    agentImplementationBrief,
    createdAt: new Date().toISOString(),
    warnings,
  }
}

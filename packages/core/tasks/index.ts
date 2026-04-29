import { GithubTask } from "../../schemas/task"
import { ReleaseIssue } from "../../schemas/release"

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

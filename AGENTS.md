# AGENTS.md

## Project Context
New Scouting Bot is a Next.js App Router project for a simpler modeling-agency workflow: share an Instagram post to a Telegram bot, identify the brand from official Instagram metadata, research a few named marketing/social leads, draft partnership outreach, and keep lightweight CRM/Gmail follow-up surfaces.

Prefer small, high-confidence changes over broad rewrites. The product direction is intentionally getting simpler, so remove complexity when the user asks, but preserve working behavior until a replacement is validated.

The app uses Bun, TypeScript, Tailwind CSS, Prisma with a local SQLite development database, Supabase-ready helpers for the hosted `newscouting` project, Exa for lead research, Telegram webhooks for bot intake, Gmail OAuth helpers for reply monitoring, and Vercel for production deployment.

## Fresh Thread Startup
When starting in a fresh Codex thread, treat this file as the durable initializer for the repo. The user should not need to paste a long setup prompt.

Default startup checklist:
- Confirm the repo root is `/Users/neuroswish/Documents/Projects/nsm-crm`.
- Read this file first.
- Inspect `git status --short --branch`, current branch, `git worktree list`, and recent commits before making substantial changes.
- Note any dirty files, especially generated or tooling-changed files such as `bun.lockb`.
- Summarize current repo state and active branches/worktrees before beginning substantial work.

If the user says to work on New Scouting, New Scouting Bot, or the modeling-agency bot/CRM, continue from these repo instructions and ask only for task-specific details that cannot be inferred safely.

## Commands
- Install: `bun install`
- Dev server: `bun run dev`
- Build/typecheck: `bun run build`
- Test: `bun test`
- Database setup: `bun run db:setup`
- Prisma generate: `bun run db:generate`
- Prisma Studio: `bun run db:studio`
- Telegram webhook registration: `bun run telegram:set-webhook <public-base-url>`

Prefer Bun commands whenever possible.

## Orchestrator Thread Rules
- Treat the main long-running repo thread as the control/orchestrator thread by default.
- In the orchestrator thread, decompose substantial features or fixes before implementation.
- For substantial work, proactively propose or create worker ownership when useful: implementation worker, investigation worker, test-gap worker, risk/security review worker, or integration worker.
- Use parallel subagents for bounded read-heavy work when it can speed up investigation without creating conflicting edits.
- Do not create worker threads for tiny edits, setup work, or user-explicit quick fixes where the coordination overhead is larger than the work.
- Keep merge decisions, shared-file conflict resolution, production-deploy decisions, and final integration in the orchestrator thread.
- Before merging or applying worker output, summarize changed files or findings, validation, risks, and merge strategy.

## Iteration Workflow
When the user gives feedback on an existing Codex-generated change, the orchestrator should not automatically create a new worker or worktree. First classify the feedback.

Same-diff iteration:
- UI tweaks
- Bug fixes in the current implementation
- Review feedback
- Small behavior adjustments
- Validation failures

Route same-diff iteration back to the original worker thread or worktree when one exists.

Independent follow-up:
- New feature
- Separate test effort
- Alternate architecture
- Security or performance review
- Risky refactor
- New production integration

Create a new worker thread or worktree for independent follow-up when isolation is useful.

Integration feedback:
- Conflicts between worker diffs
- Cherry-pick decisions
- Merge ordering
- Final cleanup
- Production readiness decisions

Keep integration feedback in the orchestrator, or create a dedicated integration worker if the review itself becomes substantial.

Default behavior:
- Iterate in the same worker or worktree when feedback modifies the existing diff.
- Create a new worktree only when the work should be independently reviewed, compared, or merged.
- Do not duplicate the same implementation across multiple worktrees unless explicitly exploring alternatives.

## Worker Thread Rules
- Use worker threads for implementation, investigation, review, testing, and integration planning.
- Write-heavy workers should use their own worktree.
- Read-only workers may inspect the main worktree when they are only producing findings.
- Avoid assigning two write-heavy workers to edit the same files unless one is explicitly experimental.
- Each worker should return changed files or findings, validation run, risks, and merge notes.

## Worktree Rules
- Prefer a worktree-first workflow for future substantial feature work.
- Recommended worktree path: `../.worktrees/nsm-crm-[type]-[short-task]`.
- Recommended branch name: `codex/[type]-[short-task]`.
- Keep worktree diffs small and scoped to the worker's owned files.
- Do not delete worktrees or branches without explicit user approval.

## Subagent Rules
- Use parallel subagents only for bounded read-heavy work.
- Good subagent tasks include codebase exploration, test-gap analysis, risk review, performance review, security review, logs, dependency analysis, and production incident investigation.
- Do not use subagents to make uncoordinated write-heavy changes in the same files.
- Summarize subagent findings before deciding on implementation or merge strategy.

## Coding Rules
- Do not add new dependencies without asking.
- Do not touch unrelated files.
- Preserve existing architecture unless explicitly asked to simplify or refactor.
- Prefer existing components and local helper APIs over new abstractions.
- Use the narrowest change that satisfies the request.
- After changes, run the narrowest relevant validation command.
- Before finishing, summarize changed files, risks, and validation run.

## UI Rules
- Before substantial UI design or redesign work, read `docs/design-language.md` and apply the local `newscouting-design-language` skill guidance when available.
- Match existing visual patterns: white surfaces, light borders, restrained shadows, simple typography, and compact operational layouts.
- The visual language is adapted from the Ares repo: quiet white-first surfaces, zinc/neutral text, restrained borders/shadows, compact fixed navigation, and mobile-first ergonomics.
- Avoid landing-page or marketing-page patterns unless explicitly requested.
- Keep interface text direct and product-like.
- Avoid one-off styling unless the file already uses that pattern.
- Prefer reusable components when a pattern appears twice.
- Check responsive behavior when changing layout-heavy surfaces.

## Bot And Outreach Rules
- The Telegram bot should identify brands from official Instagram post metadata, official embed metadata, or official owner URL shapes.
- Do not guess a brand from random `@handles`, captions, hashtags, comments, or unrelated Telegram text when an Instagram post URL is present.
- If the brand cannot be confidently identified, return a clear failure instead of inventing a brand.
- Lead research should return named marketing/social/partnership people only when sources support the role and company.
- Never construct or infer personal email addresses unless the user explicitly asks for that behavior and the UI labels the result as inferred.
- Outreach drafts must be reviewed before sending. Do not add automatic email sending without an explicit approval-oriented workflow.

## Data, Auth, And Secrets Rules
- Local development uses Prisma and `dev.db`; do not commit local database state.
- Supabase helpers live in `src/lib/supabase`.
- The hosted Supabase project is `newscouting`.
- Never expose server secrets through `NEXT_PUBLIC_*`.
- Supabase service-role keys, Telegram bot tokens, webhook secrets, Exa API keys, Google OAuth secrets, and Gmail tokens are server-only.
- For Supabase work, verify auth/RLS-sensitive changes and avoid production database changes without explicit approval.
- Gmail message bodies should not be stored unless the user explicitly approves a data-retention change.

## Deployment Rules
- Production currently runs on Vercel under the `palares/newscoutingbot` project unless the user changes ownership.
- Do not deploy, modify production environment variables, rotate webhook secrets, or change Telegram webhook registration unless the user explicitly asks.
- When debugging production bot behavior, check Vercel logs and webhook health before guessing.
- After production deploys, verify the aliased URL and relevant health endpoint.

## Diff And Review Rules
- Show or summarize diffs before asking to merge worker changes.
- Review diffs for unrelated edits, secrets, unsafe auth/data access, bot misidentification risk, outreach automation risk, responsive UI regressions, and missing validation.
- Prefer cherry-picking focused commits or manually applying focused diffs over broad merges when a worker branch contains extra churn.
- If a worker touches shared data/auth/bot-outreach code, request a security or behavior-focused review before merge.

## Git Rules
- Do not commit, push, merge, rebase, delete branches, delete worktrees, deploy, or modify production resources unless the user explicitly asks.
- Keep diffs small and reviewable.
- Do not revert user changes unless explicitly asked.
- If the user asks for a commit, run relevant validation first and include the validation result in the final summary.

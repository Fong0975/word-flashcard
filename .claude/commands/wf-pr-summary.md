Generate a pull request summary for the given git commit SHAs: $ARGUMENTS

## Steps

1. Run the following git commands in parallel to gather information:
   - `git log --no-walk --format="%h %s" $ARGUMENTS` — get commit titles
   - `git show --stat --no-walk $ARGUMENTS` — get per-commit file change lists

2. Based on the changed file paths, classify each change into the appropriate section using these rules:
   - **🖥️ API Enhancements** (Backend): Everything that serves only the Go backend
     - Go source files under `internal/`, `cmd/`, `pkg/`, `utils/` (except `utils/database/`), and root-level `main.go` — backend business logic and API endpoints
     - Their unit tests and mocks (`*_test.go`)
     - Go dependency changes: `go.mod`, `go.sum` (always here, regardless of what the package is used for)
     - The root `Dockerfile` (it builds the Go backend only)
     - Backend-only tooling and docs: `.golangci.yml`, `project-docs/COVERAGE_EXCLUSIONS.md`, generated API docs under `docs/` (`swagger.*`, `docs.go`)
   - **🌍 Webpage Enhancements** (Frontend): Everything that serves only the frontend
     - Files under `web/` — UI, components, hooks, types
     - Their unit tests (`*.test.ts(x)`) and test setup
     - Frontend dependency and build config changes: `web/package.json`, lockfile, Vite/Vitest/ESLint/Tailwind config
     - Frontend-only docs: `project-docs/design-system.md`
   - **🛢 Database Enhancements**: Files under `data/` (schema definitions, models, peers) or `utils/database/` (core DB utilities), including their unit tests and mocks (`data/mocks/`)
   - **⚙️ Others**: Project-level changes only — files that do not belong to a single side
     - `.github/` (workflows, PR template), even when a workflow targets only one side
     - Cross-cutting deployment config: `docker-compose.yml`, `.dockerignore`, `.env.example`
     - Project-level docs and tooling: `README.md`, `CLAUDE.md`, `.claude/`, `scripts/`, `VERSION`

   Classification principles:
   - A unit test, dependency, Dockerfile, config, or doc change is **never** "Others" just because it is not feature code — it follows the side it serves.
   - For a file not listed above, ask which side it serves: exactly one side → that side's section; the project as a whole → Others.
   - Tests and dependency bumps that merely accompany a feature in the same section do not need their own bullet; give them a bullet only when they are a notable change on their own (e.g. a test-only or dependency-only commit).

3. Generate the output using the template structure below.

## Output format

**IMPORTANT — empty section removal**: If a section has no bullet points, remove its heading, its bullets, AND all surrounding blank lines. The final output must contain no consecutive blank lines and no headings without content beneath them.

```
# Title
feat/fix: <Title Case summary of what changed>

## Summary
<2–3 sentences. Focus on what the user can now do or what problem is solved.
Do NOT describe implementation details or list files. Write in English.>

## Features Changes

### 🖥️ API Enhancements
- <Feature-focused bullet. What capability changed, not which file was edited.>

### 🌍 Webpage Enhancements
- <Feature-focused bullet.>

### 🛢 Database Enhancements
- <Feature-focused bullet.>

### ⚙️ Others
- <Feature-focused bullet.>

---
**Squash merge commit title**
feat/fix: <Sentence case summary of what changed>
**Suggested branch name**
feat/fix/<kebab-case-summary>
```

For example, if only `web/` files were changed, the output must look like:

```
# Title
feat: <Title Case summary>

## Summary
<summary text>

## Features Changes

### 🌍 Webpage Enhancements
- <bullet>

---
**Squash merge commit title**
feat: <Sentence case summary>
**Suggested branch name**
feat/<kebab-case-summary>
```

## Capitalization rules

- **PR Title** (`feat/fix:` line under `# Title`): words after the prefix follow **Title Case**
  - Example: `feat: Add Web Speech API Fallback and Improve Navigation State`
- **Squash merge commit title**: same content but follows **Sentence case**
  - Example: `feat: Add web speech API fallback and improve navigation state`
  - Proper nouns and acronyms (API, UI, URL, SQL, MySQL…) always keep their standard casing in both.
- **Suggested branch name**: `<type>/<kebab-case-summary>`, all lowercase, words separated by hyphens
  - Reuse the same `type` prefix as the PR Title (`feat`, `fix`, `refactor`, `chore`, `docs`, `test`)
  - Condense the title into 3–6 words; drop filler words (a, the, and, with)
  - Acronyms are lowercased in branch names (e.g. `api`, `url`, `sql`)
  - Example: for title `feat: Add Web Speech API Fallback and Improve Navigation State` → branch `feat/web-speech-api-fallback`

## Writing guidelines

- Focus on **what the user/developer gains**, not which functions or files were touched.
- Keep each bullet to one short sentence.
- Use `feat:` for new capabilities, `fix:` for bug fixes, `refactor:` for internal restructuring without behaviour change. Use the prefix that best represents the dominant change across all commits.
- If commits span both feat and fix work, prefer `feat:` and mention the fix in the summary.

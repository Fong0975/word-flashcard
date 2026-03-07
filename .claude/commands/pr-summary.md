Generate a pull request summary for the given git commit SHAs: $ARGUMENTS

## Steps

1. Run the following git commands in parallel to gather information:
   - `git log --no-walk --format="%h %s" $ARGUMENTS` — get commit titles
   - `git show --stat --no-walk $ARGUMENTS` — get per-commit file change lists

2. Based on the changed file paths, classify each change into the appropriate section using these rules:
   - **🖥️ API Enhancements**: Go source files under `internal/`, `cmd/`, `pkg/` — backend business logic and API endpoints
   - **🌍 Webpage Enhancements**: Files under `web/` — frontend UI, components, hooks, types
   - **🛢 Database Enhancements**: Files under `data/` (schema definitions) or `utils/database/` (core DB utilities)
   - **⚙️ Others**: Everything else (CI config, docs, root-level tooling, etc.)

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
```

## Capitalization rules

- **PR Title** (`feat/fix:` line under `# Title`): words after the prefix follow **Title Case**
  - Example: `feat: Add Web Speech API Fallback and Improve Navigation State`
- **Squash merge commit title**: same content but follows **Sentence case**
  - Example: `feat: Add web speech API fallback and improve navigation state`
  - Proper nouns and acronyms (API, UI, URL, SQL, MySQL…) always keep their standard casing in both.

## Writing guidelines

- Focus on **what the user/developer gains**, not which functions or files were touched.
- Keep each bullet to one short sentence.
- Use `feat:` for new capabilities, `fix:` for bug fixes, `refactor:` for internal restructuring without behaviour change. Use the prefix that best represents the dominant change across all commits.
- If commits span both feat and fix work, prefer `feat:` and mention the fix in the summary.

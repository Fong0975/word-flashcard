Suggest 3 git commit titles for the currently staged changes.

## Steps

1. Run `git diff --staged --stat` to see which files changed and how many lines.
2. Run `git diff --staged` to read the actual content of the staged changes.

## Output format

Provide exactly 3 candidate commit titles, numbered, with a blank line between each:

```
1. feat: Add reminder field display and clear action on word detail page

2. feat: Add reminder note input in quiz show-answer stage

3. feat: Add with reminder quick filter with session persistence
```

No explanation, no additional text — just the 3 titles.

## Rules

- Start with a category prefix: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`
  - `feat:` — new user-facing capability
  - `fix:` — corrects a bug or incorrect behaviour
  - `refactor:` — internal restructuring with no behaviour change
  - `chore:` — tooling, config, dependency updates
  - `docs:` — documentation only
  - `test:` — tests only
- After the prefix, use **Sentence case**: capitalize only the first word; all other words are lowercase unless they are proper nouns or acronyms (e.g. API, UI, URL, SQL).
- Focus on **what the user/developer can now do or what was fixed**, not which files or functions were changed.
- Each of the 3 titles should offer a meaningfully different angle or scope:
  - One broad (covers all staged changes together)
  - One focused on the most significant single change
  - One alternative phrasing or scope
- Keep each title under 72 characters.
- Write in English.

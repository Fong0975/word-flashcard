Suggest 3–5 git commit titles for the currently staged changes.

## Steps

1. Run `git log --oneline -20` to detect the casing style, verb tense, and typical title length actually used in this project's recent commit history.
2. Run `git diff --staged --stat` to see which files changed and how many lines.
3. Run `git diff --staged` to read the actual content of the staged changes.

## Output format

Provide 3 to 5 candidate commit titles, numbered, ordered from most to least recommended, with a blank line between each. Mark the top pick with `← recommended`:

```
1. feat: Add reminder field display and clear action on word detail page   ← recommended

2. feat: Add reminder note input in quiz show-answer stage

3. feat: Add with reminder quick filter with session persistence
```

If the staged changes span multiple unrelated concerns (e.g. a bug fix mixed with a refactor mixed with a dependency update), add 2–3 sub-description bullets beneath the recommended title to capture the full scope. Keep each bullet under 72 characters:

```
1. feat: Add reminder field display and clear action on word detail page   ← recommended
  - Add reminder note input in quiz show-answer stage
  - Add with reminder quick filter with session persistence

2. ...

3. ...
```

No explanation, no additional text — just the titles (and sub-description bullets when applicable).

## Rules

- Start with a category prefix: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`
  - `feat:` — new user-facing capability
  - `fix:` — corrects a bug or incorrect behaviour
  - `refactor:` — internal restructuring with no behaviour change
  - `chore:` — tooling, config, dependency updates
  - `docs:` — documentation only
  - `test:` — tests only
- After the prefix, follow the casing, verb tense, and length conventions observed in the last 20 commits. If the history is ambiguous or inconsistent, default to **Sentence case**: capitalize only the first word; all other words are lowercase unless they are proper nouns or acronyms (e.g. API, UI, URL, SQL).
- Focus on **what the user/developer can now do or what was fixed**, not which files or functions were changed.
- Each title should offer a meaningfully different angle or scope:
  - One broad (covers all staged changes together)
  - One focused on the most significant single change
  - One alternative phrasing or scope
- Keep each title under 72 characters.
- Write in English.

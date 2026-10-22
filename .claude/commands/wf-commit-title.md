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

### Sub-description bullets (last resort only)

**Default to title-only output.** Sub-description bullets are an exception, not a regular option. Before adding any, first try to make a single title cover the change — broaden its scope, pick a more general verb, or describe the shared outcome.

Add bullets **only when all of the following are true**:

- The staged changes contain important details that no title under 72 characters can reasonably express, even after rephrasing or broadening the scope.
- Leaving those details out would make the commit genuinely misleading or hide something a reviewer must know (e.g. a breaking change, a data migration, an unrelated bug fix bundled in).
- The details are not just a list of the files, components, or small steps that already fall under the title.

Do **not** add bullets merely because:

- The diff touches many files or several related parts of one feature.
- The changes could be listed in more detail — a title is supposed to summarise.
- The bullets would just restate or slightly expand the title.

When bullets are truly warranted, attach them to **at most one** candidate (normally the recommended one), use 2–3 bullets, and keep each under 72 characters. All other candidates stay title-only:

```
1. feat: Add subscription amount history and start date   ← recommended
  - Add migration backfilling start date for existing subscriptions
  - Fix calendar double-counting charges on the first billing day

2. ...

3. ...
```

In most cases the output should contain no bullets at all.

No explanation, no additional text — just the titles (and sub-description bullets only in the rare cases above).

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
- Every candidate must stand on its own as a complete, self-sufficient title; never rely on sub-description bullets to make a title understandable.
- Write in English.

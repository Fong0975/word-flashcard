# Project Instructions

## Project Structure

- **Backend / API**: Written in Go. Lives at the repository root (outside `./web/`).
- **Frontend**: React + Vite (TypeScript). All frontend source lives under `./web/`.

When a request mentions frontend, backend, API, or pages/screens, use this mapping to locate the relevant code first.

## Frontend Design Guidelines

Applies to all UI work under `./web/`.

### Design direction

- The app uses a glassmorphism (translucent surface) style on Tailwind CSS, with `dark` and `data-theme='light'` themes. Keep this style; do not switch the overall aesthetic, font family, or primary color unless explicitly asked.
- `project-docs/design-system.md` is the source of truth for tokens (colors, blur levels, surface opacity, radius, shadow, motion). Read it before changing any screen. If it conflicts with a design skill's suggestion, the document wins.

### Design system document lifecycle

- `project-docs/design-system.md` is created once, by an explicit request. Do not create or regenerate it on your own.
- If the file does not exist, do not invent design tokens; ask whether to create it first.
- Update it in the same change whenever a shared token or shared glass class is added, renamed, or removed (colors, blur levels, opacity, radius, shadow, motion).
- Do not update it for one-off, page-specific styling.
- Do not rewrite it wholesale. Make targeted edits, and mention the edit in the response.

### Skill usage

- Use `ui-ux-pro-max` for design-system decisions and UX review of existing screens.
- Use `frontend-design` only when creating a new page or component from scratch, and only within the direction above.
- Both skills are advisory. Do not apply a skill's style recommendation to untouched screens.

### Implementation rules

- Reuse existing shared components in `web/src/components/ui` and `web/src/components/layout` before adding new ones.
- Do not repeat long glass class strings; extract a shared component, `@layer components` class, or Tailwind token when the same combination appears more than twice.
- Every change must work in both dark and light themes and at phone width.
- Keep text contrast at WCAG AA or better on translucent surfaces.
- Interactive elements must have a visible keyboard focus indicator. Do not add `outline: none` without a replacement style.
- Respect `prefers-reduced-motion`; keep transitions subtle and short.
- Keep changes scoped to the screens named in the request; do not restyle unrelated pages.

## Off-limits directories

- **Do not modify any files inside `./docker/`** — this directory has its own separate configuration and must not be touched.

# Design System

Source of truth for the visual language of the Flashcard web app (`./web/`).
It documents what the code **currently does** (glassmorphism on Tailwind CSS, `dark` + light themes); it does not propose a new aesthetic.

Key design point: **no browser-default focus ring.** The blue default outline / glow on focused inputs and buttons is intentionally suppressed globally; each interactive element supplies its own glass-style focus indicator instead (see §9).

Authoritative sources:

| Concern | File |
| --- | --- |
| Shared glass classes, scrollbar, keyframes | `web/src/index.css` |
| Primary palette, dark-mode strategy | `web/tailwind.config.js` |
| Page backdrop | `web/src/components/layout/PageBackground.tsx` |
| Theme switching | `web/src/hooks/useDarkMode.ts` |
| Chart glass tokens | `web/src/components/ui/charts/chartGlassStyles.tsx` |

## 1. Theming model

- Tailwind `darkMode: 'class'`. `useDarkMode` toggles the `dark` class on `<html>`, persists the choice in `localStorage['theme']`, and falls back to `prefers-color-scheme`.
- **Light is the absence of `dark`.** Every glass class therefore defines the light values as the default and the dark values behind `dark:`.
- `index.html` sets `theme-color` per scheme: `#ffffff` (light), `#1f2937` (dark).
- Known discrepancy: `index.css` declares `[data-theme='light'] { --app-bg: #ffffff }`, but no code sets `data-theme`. The `:root` value `--app-bg: #1f2937` is the one that always applies. It is never visible in practice because `PageBackground` (fixed, `-z-10`) paints over `body`. Do not rely on `--app-bg` for new work.

## 2. Color

### 2.1 Brand / primary

Tailwind `primary` scale (blue, equal to Tailwind `blue`), defined in `tailwind.config.js`. `index.css` mirrors 50/100/500–900 as `--primary-*` CSS variables.

Use `primary-*` for brand and interaction colors (active tab, focus rings, selected toggles, spinners, links, hover tints). Use `blue-*` only for the **info** status (Toast, `.glass-alert-info`, `.markdown-alert-note`, log level INFO, informational banners).

| Token | Hex | Typical use |
| --- | --- | --- |
| `primary-50` | `#eff6ff` | |
| `primary-100` | `#dbeafe` | |
| `primary-200` | `#bfdbfe` | Dark selected-menu text |
| `primary-300` | `#93c5fd` | Light backdrop |
| `primary-400` | `#60a5fa` | Dark hover/focus tint, focus ring, dark checked border; light backdrop |
| `primary-500` | `#3b82f6` | Dark primary CTA fill, hover tint, light focus ring; dark backdrop |
| `primary-600` | `#2563eb` | Light primary CTA fill; dark CTA hover; dark backdrop |
| `primary-700` | `#1d4ed8` | Light CTA hover; light selected-menu text; dark backdrop |
| `primary-800` | `#1e40af` | |
| `primary-900` | `#1e3a8a` | |

### 2.2 Neutrals

Tailwind `gray` is the only neutral scale.

| Role | Light | Dark |
| --- | --- | --- |
| Page base (`PageBackground`) | `gray-100` | `gray-950` |
| Heading / primary text | `gray-900` | `white` |
| Body text | `gray-700` / `gray-600` | `gray-200` / `gray-300` |
| Supporting text (dates, counts, captions) | `gray-600` (`.text-supporting`) | `gray-400` |
| Subtle icons / decorative glyphs only (never text) | `gray-500` (`.text-subtle`) | `gray-500` |
| Disabled text | `gray-400` | `gray-500` |
| Divider (non-glass) | `gray-200` | `gray-700` |
| Input placeholder | `gray-500` | `gray-400` |
| Glass border | `white/50`–`white/70` | `white/10`–`white/[12%]` |
| Glass top highlight (`--glass-highlight`) | `white` / .70 | `white` / .14 |

### 2.3 Semantic (status) colors

All semantic colors use the stock Tailwind scales; each has a light surface/text pair and a dark pair. Toast and inline `ErrorMessage` surfaces use the `.glass-alert-*` classes (§4.2).

| Status | Light surface / border | Light text | Dark surface / border | Dark text | Icon / progress |
| --- | --- | --- | --- | --- | --- |
| Success | `green-50/70` / `green-200` | `green-800` | `green-900/40` / `green-700` | `green-200` | `green-400` (bar `green-400`, dark `green-500`) |
| Error / danger | `red-50/70` / `red-200` | `red-800` (body `red-700`) | `red-900/40` / `red-700` | `red-200` (body `red-300`) | `red-400` |
| Warning | `yellow-50/70` / `yellow-200` | `yellow-800` | `yellow-900/40` / `yellow-700` | `yellow-200` | `yellow-400` |
| Info | `blue-50/70` / `blue-200` | `blue-800` | `blue-900/40` / `blue-700` | `blue-200` | `blue-400` |

Confirm / action fills are glass CTAs: danger = `.glass-button-danger` (`red-600/90`), warning = `.glass-button-warning` (`yellow-700/90`), success = `.glass-button-success` (`green-700/90`), info = `.glass-button-primary` (`primary-600/90`). Light fills are one step darker than the status hue's usual `-500`/`-600` so white text stays at WCAG AA (4.5:1); dark fills keep their lower alpha.

Markdown alerts (`.markdown-alert-*`) use a 4px left border: note = blue, tip = green, important = purple, warning = yellow, caution = red (`-500` light, `-400` dark; title text `-600` light, `-400` dark). Their body surface is translucent glass (`gray-50/70` light, `gray-900/40` dark, `shadow-sm`, no blur), matching `.glass-alert-neutral`; only the left border and title carry the type color.

### 2.4 Backdrop (what the glass blurs)

`PageBackground` is one fixed element painting the page base plus a stack of static `radial-gradient`s (`bg-glass-backdrop` / `dark:bg-glass-backdrop-dark`, defined in `tailwind.config.js`). No `filter` and no animation. Glass has nothing to show without it, so every page shell must include it.

Two kinds of shape, sized in `vmax` so the composition scales with the viewport:

- **Washes** fade evenly to transparent and set the overall tone.
- **Orbs** keep a near-flat core and a short falloff, so they remain recognisable shapes through a panel's backdrop blur. This shape detail is what makes a panel read as glass rather than as a flat tint.

| Shape | Radius | Position | Light (peak) | Dark (peak) |
| --- | --- | --- | --- | --- |
| Wash, top-left | 46vmax | 0% 0% | `primary-300` / .70 | `primary-600` / .28 |
| Wash, top-right | 44vmax | 100% 5% | `indigo-300` / .55 | `indigo-600` / .30 |
| Wash, bottom-left | 42vmax | 30% 105% | `sky-300` / .60 | `sky-700` / .35 |
| Orb, right | 16vmax | 78% 38% | `primary-400` / .35 | `primary-500` / .22 |
| Orb, left | 13vmax | 18% 62% | `indigo-300` / .50 | `indigo-500` / .28 |
| Orb, bottom-right | 20vmax | 92% 92% | `primary-300` / .60 | `primary-700` / .32 |
| Orb, center | 11vmax | 50% 46% | `sky-300` / .45 | `sky-600` / .20 |

`sky` and `indigo` are backdrop-only accents adjacent to the primary blue; do not use them for UI elements. The peak alphas are capped so supporting text keeps AA on the lightest glass tier — re-check contrast before raising one or overlapping two cores.

### 2.5 Scrollbar

Thin (8px), transparent track, pill thumb.

| State | Light | Dark |
| --- | --- | --- |
| Thumb | `rgb(100 116 139 / .40)` | `rgb(148 163 184 / .35)` |
| Thumb hover | `rgb(100 116 139 / .60)` | `rgb(148 163 184 / .55)` |

## 3. Typography

- **Font family: Tailwind defaults.** No custom `fontFamily` in `tailwind.config.js`, no `@font-face`, no web-font links. Body text is the system sans stack (`font-sans`); `font-mono` (system mono) is used only for rank numbers, logs and the markdown editor. Do not introduce a web font unless explicitly asked.
- Plugin: `@tailwindcss/typography` (`prose`) for rendered markdown.
- Base size 16px (Tailwind default), numerals in rank badges use `tabular-nums`.

| Role | Classes |
| --- | --- |
| App title (Header) | `text-2xl font-bold text-gray-900 dark:text-white` |
| Empty-state title | `text-xl font-semibold text-gray-900 dark:text-white` |
| Section / modal title | `text-lg font-semibold` (modal: `gray-900`/`white`; collapsible: `gray-800`/`gray-200`) |
| Dialog title | `text-lg font-medium text-gray-900 dark:text-white` |
| Body | `text-base` / `text-sm`, `text-gray-700 dark:text-gray-200` |
| Buttons, tabs, menu items, toasts | `text-sm font-medium` |
| Dialog message | `text-sm text-gray-600 dark:text-gray-400` |
| Rank / numeric badge | `font-mono text-base font-bold tabular-nums` |
| Log / code | `font-mono text-xs` |
| Chart labels & tooltips | `text-xs` (12px) |

Use `.text-supporting` / `.text-subtle` instead of hand-writing gray pairs for these two tiers; plain `hover:` / `group-hover:` color utilities still override them. Not every existing usage has been migrated yet.

Use `.text-error` (`red-600` light, `red-400` dark) for error text, required-field asterisks and error icons instead of `text-red-500`, which is below AA on light glass. Status-colored icons and numbers on tinted light backgrounds use `*-600`/`*-700` (`yellow-700`, `amber-700`), keeping `*-400` for dark only.

Contrast rule: body and control text must reach WCAG AA (4.5:1) on the glass surface they sit on. The lightest allowed text on light glass is `gray-500`; on dark glass `gray-400`. `gray-400` on light and `gray-500` on dark are for disabled states only.

## 4. Glass system

All glass surfaces are shared `@layer components` classes in `index.css`. Use them; do not re-spell the utility strings. A glass surface = **translucent fill + 1px light edge + top highlight + backdrop blur + soft shadow**. Blurred tiers that sit directly over the backdrop or page content (`.glass-panel`, `.glass-panel-strong`, `.glass-panel-dropdown`) also apply `backdrop-saturate-150`, so the colors behind come through vivid rather than washed out; it shares the blur's single `backdrop-filter` pass.

### 4.1 Blur scale

| Tailwind | Radius | Used by |
| --- | --- | --- |
| `backdrop-blur-md` | 12px | `.glass-alert-*` (Toast floats over page content) |
| `backdrop-blur-lg` | 16px | `.glass-panel` |
| `backdrop-blur-xl` | 24px | `.glass-panel-strong`, `.glass-panel-dropdown` |
| chart tooltip | `6px` (inline style) / `backdrop-blur-md` | `chartGlassStyles` |

Higher blur = higher elevation in the layer stack (page → panel → overlay).

Blur budget: `backdrop-filter` is the most expensive property in the system, so only surfaces that sit **directly over the backdrop or over page content** carry it. Everything that lives inside one of those surfaces — `.glass-panel-card` rows, inputs, buttons, checkboxes, radios, tints, the progress track, markdown alerts — is a translucent fill with an edge and highlight but **no blur**: what is behind it has already been blurred by its container, so a second pass costs a filter per element and changes nothing visible. Hover and focus states never add blur, and `backdrop-filter` is never transitioned. Do not add `backdrop-blur-*` to a new nested surface or to a list item.

### 4.2 Surface tiers (opacity + border)

| Class | Light fill | Light border | Dark fill | Dark border | Blur | Shadow | Role |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `.glass-panel` | gradient `white/[22%]` → `white/[8%]` (to bottom-right) | `white/50` | gradient `white/[5%]` → `white/[2%]` | `white/10` | `lg` + saturate 150 | `glass` | Page content card, tab wrapper, large containers |
| `.glass-panel-card` | `white/[22%]` | `white/60` | `white/[5%]` | `white/[12%]` | none | `glass` | Per-record rows nested **inside** a `.glass-panel` (EntityCard, NoteCard, CollapsibleSection) |
| `.glass-panel-strong` | gradient `white/[66%]` → `white/[55%]` | `white/70` | gradient `gray-800/[68%]` → `gray-800/[60%]` | `white/10` | `xl` + saturate 150 | `glass` (Modal/Dialog add `shadow-glass-raised`) | Header, Modal, ConfirmationDialog |
| `.glass-input` | `gray-100/70` | `white/70` | `gray-900/50` | `white/10` | none | `sm` | Text inputs / textareas / date pickers |
| `.glass-checkbox` | `white/30` (checked `primary-500/80`) | `white/70` (checked `primary-500`) | `white/10` (checked `primary-500/80`) | `white/20` (checked `primary-400`) | none | `sm` | Native checkbox |
| `.glass-radio` | `white/60` (checked `primary-500/80`) | `gray-500` (checked `primary-500`) | `white/10` (checked `primary-500/80`) | `gray-400` (checked `primary-400`) | none | `sm` | Native radio (round, white dot when checked), same keyboard focus ring as `.glass-checkbox`. Unchecked edge is a solid gray (≥3:1) rather than `white/*`, which vanishes on white cards |
| `.glass-alert-*` (`success` / `error` / `warning` / `info` / `neutral`) | `*-50/70` | `*-200` | `*-900/40` | `*-700` | `md` | `sm` | Toast, inline `ErrorMessage` (text / icon colors set per usage) |
| `.glass-progress-track` | `white/20` | `white/30` | `gray-800/30` | `white/10` | none | `inner` | Quiz progress track (fill stays solid primary) |
| `.glass-card-hover` | hover: `gray-100/80`, border `primary-300`, `shadow-glass-raised` | unchanged | hover: `gray-800/70`, border `primary-600` | unchanged | none | `glass-raised` on hover | Add next to `.glass-panel-card` on clickable record rows (EntityCard, NoteCard) |
| `.glass-panel-dropdown` | `white/90` | `white/70` | `gray-800/90` | `white/10` | `xl` + saturate 150 (radius `md`) | `glass-raised` | Every floating menu: Info and Settings dropdown panels and `DropdownMenu` (sort, page, answer and familiarity selects, action menus). Near-opaque so menu items stay readable over the list rows and form fields behind them; do not use `.glass-panel-strong` for a menu |
| `.glass-tint-green` / `.glass-tint-yellow` | `green-100/50` / `yellow-100/50` | `green-300/60` / `yellow-300/60` | `green-900/30` / `yellow-900/30` | `green-700/40` / `yellow-700/40` | none | none | Collapsible status sections: dictionary lookup (green), Answer & Explanation (yellow); add `overflow-hidden` and rounding per use |
| `.glass-interactive` | transparent → `primary-500/[15%]` hover/focus, `/25` active | transparent | transparent → `primary-400/20` hover/focus, `/30` active | transparent | none | `sm` on hover/focus | Secondary buttons, icon buttons, back button |
| `.glass-border-subtle` | n/a (border only) | `gray-500/25` | n/a | `white/15` | none | none | Modifier stacked on `.glass-interactive` for standalone buttons (Cancel, Quick select, ActionButton, mobile pagination) so they read as buttons at rest. Do not use inside an already-bordered group (segmented toggles, toolbars). Defined after `.glass-interactive` so it overrides its transparent border |
| `.glass-nav-button` / `.glass-nav-button-group` | transparent → `gray-100/60` hover/focus (`-group`: parent `group` hover or focus-within) | transparent | transparent → `gray-800/50` hover/focus | transparent | none | none | Header icon buttons (theme toggle; `-group` variant for the Info and Settings dropdown triggers). Icon `gray-500` / `gray-400` → `gray-900` / `white` |
| `.glass-hover-fill` | transparent → `gray-100/60` hover | transparent | transparent → `gray-800/50` hover | transparent | none | none | Hover fill for bordered buttons (Pagination nav buttons); border and text color stay with the usage |
| `.segmented-divider` | `border-l white/30` | `white/30` | `border-l white/10` | `white/10` | none | none | Left divider on every segment except the first in a segmented control (Stats modal tabs) |
| `.glass-button-primary` | `primary-600/90` (hover `primary-700/90`) | transparent | `primary-500/60` (hover `/75`) | transparent | none | `md` (dark `lg`) | Primary CTA, active filter / page |
| `.glass-button-success` | `green-700/90` (hover `green-800/90`) | transparent | `green-600/60` (hover `/75`) | transparent | none | `md` (dark `lg`) | Success / fetch CTA |
| `.glass-button-danger` | `red-600/90` (hover `red-700/90`) | transparent | `red-600/60` (hover `/75`) | transparent | none | `md` (dark `lg`) | `ConfirmationDialog` `danger` confirm |
| `.glass-button-warning` | `yellow-700/90` (hover `yellow-800/90`) | transparent | `yellow-600/60` (hover `/75`) | transparent | none | `md` (dark `lg`) | `ConfirmationDialog` `warning` confirm |
| `.focus-ring` / `-danger` / `-success` / `-warning` / `-indigo` | unchanged | unchanged | unchanged | unchanged | none | none | Keyboard focus ring (`focus-visible:ring-2`, `primary-400/60`, `red-400/60`, `green-400/60`, `yellow-500/60`, `indigo-400/60`) for buttons/links without a glass class; add `focus-visible:ring-inset` under `overflow-hidden` parents |

Layering invariants (documented in `index.css`; breaking them makes a surface vanish):

1. A panel tone must stay visibly different from the page base (light `gray-100`, dark `gray-950`). Blending a color onto an identical backdrop is a no-op.
2. A nested surface must read as **less transparent** than its container. A `glass-panel-card` (22 / 5 %) stacks its fill on top of the `glass-panel` behind it (22→8 / 5→2 %) and is outlined by its border and top highlight; `glass-panel-strong` (66→55 % white / 68→60 % `gray-800`) is the densest container tier. Its fill must not drop below 55 % (light) / 60 % (dark): modals and dialogs open over page text, which shows through a thinner fill.
3. A field must be more opaque than the modal it sits in (`glass-input` reads as a well).
4. Primary CTAs are far more opaque than `.glass-interactive`'s resting state so they stay the clearest action.

Dark vs light differences (summary): light glass is **white-tinted** with a bright white edge (`white/50–70`). Dark `.glass-panel` and `.glass-panel-card` are tinted with **low-alpha white** (2–5 %), which brightens the backdrop instead of graying it, with a faint white edge (`white/10–12`); the tiers that sit over sharp content (`.glass-panel-strong`, `.glass-panel-dropdown`, inputs) stay **gray-800/900-tinted** for legibility. Dark CTAs drop from `/90` to `/60` alpha so the backdrop colors still read.

Contrast budget: every white fill in dark raises the surface luminance, so the dark panel/card alphas and the dark backdrop peaks (§2.4) are tuned together to keep `gray-400` text at AA on a card over the brightest backdrop shape. Raise one only after re-checking the other. `.glass-panel-strong` keeps a dense light fill because the modal scrim darkens what is behind it, which would otherwise pull `gray-600` text below AA.

### 4.3 Overlays and non-glass surfaces

| Surface | Light | Dark |
| --- | --- | --- |
| Modal / dialog scrim | `bg-black/30` | `bg-black/30` (same) |
| Toast | `.glass-alert-{success,error,warning,info,neutral}` | same class |
| Inline `ErrorMessage` | `.glass-alert-error` | same class |
| Chart tooltip | frosted dark for **both** themes: `rgba(31,41,55,.85)`, border `rgba(255,255,255,.15)`, text `#f3f4f6`, blur 6px (recharts inline styles cannot read `dark:`) | same |
| Chart bars | stroke `rgba(255,255,255,.25)` @ 0.5px, fill opacity `0.85` | same |

### 4.4 Fallbacks

Both live at the end of the `@layer components` block in `index.css`, after the glass classes they override. A new blurred tier must be added to both.

| Condition | What changes |
| --- | --- |
| `@supports not (backdrop-filter)` | Tiers that float over sharp content take a near-opaque fill so text stays legible without blur: `.glass-panel-strong` and `.glass-panel-dropdown` → `white/95` / `gray-800/95`; `.glass-alert-*` → solid `*-50` / `*-950` (neutral `gray-50` / `gray-900`). `.glass-panel` is unchanged (the backdrop behind it is already soft). |
| `prefers-reduced-transparency: reduce` | Every blurred tier drops its blur and gradient: `.glass-panel` → `white/90` / `gray-900/95`; the others as above. Their border becomes solid (`gray-200` / `gray-700`). Nested surfaces keep their fills. |

## 5. Radius

| Token | px | Used by |
| --- | --- | --- |
| `rounded` | 4 | `.glass-checkbox`, scrollbar-picker icon |
| `rounded-md` | 6 | Buttons, inputs (`.glass-input`), dropdown panel, tabs' hover chips, header icon buttons, toast progress edge |
| `rounded-lg` | 8 | Panels, cards, modals, dialogs, toasts, error banners, logo |
| `rounded-r-md` | 6 (right only) | `.markdown-alert` |
| `rounded-full` | 9999 | Spinners, progress track, scrollbar thumb, icon bubbles |

Rule: controls = `md`, containers = `lg`, pills/circles = `full`. Nothing larger than `lg` is used on rectangular surfaces.

## 6. Shadow

Shadows are deliberately low-key so glass edges, not drop shadows, carry the depth.

The `glass` tokens (`tailwind.config.js`) bundle the glass lighting into one `box-shadow`: an inset 1px top highlight, an inset 1px bottom edge, and a soft ambient shadow. Their colors are the `--glass-highlight`, `--glass-edge` and `--glass-shadow` variables in `index.css` (`:root` for light, `.dark` for dark), so one class serves both themes. A stock `shadow-*` utility on the same element replaces the whole value, highlight included — use `shadow-glass-raised` to lift a glass panel instead.

| Token | Use |
| --- | --- |
| `shadow-glass` | `.glass-panel`, `.glass-panel-card`, `.glass-panel-strong` at rest |
| `shadow-glass-raised` | Modal and dialog panels, `.glass-panel-dropdown`, `.glass-card-hover` on hover |
| `shadow-sm` | Inputs, checkbox, radio, alerts, pagination group |
| `shadow-inner` | Progress track |
| `shadow-md` (dark: `shadow-lg`) | CTA buttons |
| `shadow-lg` (hover `shadow-xl`) | Toast |

| Variable | Light | Dark |
| --- | --- | --- |
| `--glass-highlight` | `rgb(255 255 255 / .70)` | `rgb(255 255 255 / .14)` |
| `--glass-edge` | `rgb(15 23 42 / .06)` | `rgb(0 0 0 / .25)` |
| `--glass-shadow` | `rgb(30 58 138 / .14)` | `rgb(0 0 0 / .45)` |

## 7. Spacing and layout

- Page shell: `max-w-7xl` (Header) / `max-w-4xl` (detail pages); gutters `px-4 sm:px-6 lg:px-8` (Header), `px-4 sm:px-3 lg:px-10` (detail content).
- Header height `h-16`; panel padding `px-3`, growing to `lg:px-6` on large screens.
- Safe areas: root shell uses `pt-[env(safe-area-inset-top)]` and `pb-[max(1rem,env(safe-area-inset-bottom))]` (iOS standalone / `viewport-fit=cover`).
- Button padding: `px-4 py-2` (standard), `p-2` (icon-only, ≈36–40px), tab `py-4`.
- Responsive breakpoints are Tailwind defaults; phone width is the baseline (`sm` = 640px is where toasts leave the bottom edge and tab icons appear).

## 8. Motion

| Pattern | Duration / easing | Notes |
| --- | --- | --- |
| Color / surface transitions (`transition-colors`) | 200ms (Tailwind default easing) | Buttons, tabs, menu items. `.glass-interactive` also transitions `box-shadow`. List rows (`EntityCard`, `NoteCard`) name their transitioned properties explicitly instead of `transition-all` |
| Modal panel (`transition-all`) | 200ms `ease-in-out` | Scrim uses `transition-opacity` |
| Chevron rotate | 200ms | `CollapsibleSection`, `ActionButton` |
| Header theme icon | moon `-rotate-12` 300ms `ease-out`; sun `rotate-180` 500ms `ease-out` | Hover only |
| Toast enter | `slide-in-right` 0.3s `ease-out` (below 640px: `slide-in-bottom`) | Defined in `index.css` |
| Toast exit | `slide-out-right` 0.3s `ease-in` | |
| Toast progress bar | `toast-progress` linear, duration = toast duration (default 4000ms) | `scaleX(1→0)` from the left |
| Spinner | Tailwind `animate-spin` | |
| Smooth scroll | `html { scroll-behavior: smooth }` | |

Reduced motion: `@media (prefers-reduced-motion: reduce)` collapses all animation/transition durations to `0.01ms`, forces one iteration and disables smooth scroll. New motion must work under this rule and stay ≤300ms (decorative hover rotations are the only exception).

Light vs dark: motion is identical in both themes.

## 9. Focus and accessibility

- By design there is **no browser-default focus ring**. `index.css` has a single `@layer base { *:focus { outline: none !important } }` rule and no other global outline rule, so there is no global focus ring. Every interactive element must supply its own visible keyboard indicator:
  - Primary / success CTA, checkbox: `focus-visible:ring-2` (`primary-400/60`, `green-400/60`, `red-400/60` or `yellow-400/60` for buttons; `primary-500` for checkbox). No `ring-offset-*`: its default offset color is white and shows as a white gap around the ring on dark glass.
  - `.glass-input`: `focus:border-primary-400/70 focus:ring-2 focus:ring-primary-400/30` (dark: `/50` border, `/20` ring).
  - `.glass-interactive`: `focus-visible:` mirrors the hover tint (`primary-500/[15%]` light, `primary-400/20` dark) plus shadow.
  - Pagination mobile buttons: `focus-visible:ring-2 focus-visible:ring-primary-500`.
- Use `focus-visible:ring-*`, not `focus:ring-*`, on buttons and other click targets: `focus:` also fires on mouse click and leaves a conspicuous ring on the clicked element. `focus:ring-*` is for text fields only (`.glass-input`, search bars, the markdown editor wrapper), where the ring should show on any focus. Do not add `ring-offset-*`.
- Buttons and links that have no glass class (`.glass-interactive`, `.glass-button-*`) take `.focus-ring` (or the `-danger` / `-success` / `-warning` / `-indigo` variant matching their hue) instead of repeating the ring utilities. Where the ring would be clipped by an `overflow-hidden` parent (e.g. `CollapsibleSection`, `AnswerSection` headers), add `focus-visible:ring-inset`.
- Do not add `outline-none` without a replacement style. When creating a bare `<button>` check that it actually has one; several legacy controls (Modal close icon, Tab buttons: `focus:ring-0`) rely only on the color change of the active/hover state.
- Icon-only buttons need `aria-label` (Header, Modal close, Pagination use `sr-only` text).
- Toast: `role='alert'`, container `aria-live='polite'`, keyboard-dismissable (Enter/Space).
- Do not rely on color alone for status: toasts pair a color with an icon and message; keep this when adding statuses.

## 10. Component recipes

Reuse these before building new UI (`web/src/components/ui`, `web/src/components/layout`).

| Need | Use |
| --- | --- |
| Page shell | `DetailPageLayout` (`PageBackground` + `Header` + back button + `glass-panel` card) |
| Top bar | `Header` (`glass-panel-strong`, `border-x-0 border-t-0`) |
| Tabs | `TabNavigation` / `TabContent` (active: `border-primary-500 text-primary-600 dark:text-primary-400`; inactive: `gray-500`/`gray-400`, hover `gray-700`/`gray-300`) |
| Modal | `Modal` (`glass-panel-strong rounded-lg shadow-xl`, scrim `black/30`, header divider `gray-200`/`gray-700`) |
| Confirm | `ConfirmationDialog` (`danger` / `warning` / `info`) |
| Menu | `DropdownMenu`, `ActionButton` (selected item: `primary-500/10` + `primary-700` light, `primary-400/20` + `primary-200` dark) |
| Section | `CollapsibleSection` (`glass-panel-card`, hover `gray-100/80` / `gray-800/70`) |
| Primary action | `.glass-button-primary` + `rounded-md px-4 py-2 text-sm font-medium` |
| Secondary action | `.glass-interactive .glass-border-subtle` + `rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300` |
| Form field | `.glass-input` (add width, padding, rounding per use), `.glass-checkbox` |
| Feedback | `Toast`/`ToastContainer`, `ErrorMessage`, `EmptyState`, `LoadingSpinner` |
| Pagination | `Pagination` (segmented on desktop with `border-gray-300`/`gray-600`, standalone `.glass-interactive` on mobile) |
| Charts | `chartGlassStyles` constants (`GLASS_TOOLTIP_*`, `CHART_TEXT_CLASSNAME`, `GLASS_BAR_*`) |

### Icons

Two icon styles are used on purpose, each for its own job. No icon library is installed; do not add one unless explicitly asked.

| Use | Style | Why |
| --- | --- | --- |
| Controls and status (Header, Toast, dialogs, menus, buttons) | Inline SVG, outline style, `stroke='currentColor'`, `aria-hidden='true'` | Follows the text color and the light / dark theme |
| Tab labels, empty states, error / result screens (📝 ❓ 📒 📚 🔍 😕 🎉 ❌ ⚠️) | Emoji | Conveys tone at a glance with zero dependencies; the platform-specific look is accepted |

Rules:

- Emoji are decorative, never the only carrier of meaning. Keep a text label or message next to them (tab label, empty-state title).
- Use emoji for empty-state / result / error illustration (`text-6xl`) and tab prefixes only; use inline SVG for anything that must recolor with the theme.
- Status marks inside text (`✓ Correct`, `✗ Incorrect`) stay plain text glyphs and are colored through the surrounding text color classes.

Extraction rule: if the same glass utility combination appears more than twice, promote it to a shared component, `@layer components` class or Tailwind token.

## 11. Known gaps (for awareness, not yet fixed)

- `data-theme='light'` selector in `index.css` is unused (theme is class-based); see §1.

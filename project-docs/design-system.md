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
| `primary-200` | `#bfdbfe` | Light backdrop blob; dark selected-menu text |
| `primary-300` | `#93c5fd` | Light backdrop blobs |
| `primary-400` | `#60a5fa` | Dark hover/focus tint, focus ring, dark checked border |
| `primary-500` | `#3b82f6` | Dark primary CTA fill, hover tint, light focus ring |
| `primary-600` | `#2563eb` | Light primary CTA fill; dark CTA hover; dark backdrop blob |
| `primary-700` | `#1d4ed8` | Light CTA hover; light selected-menu text; dark backdrop blob |
| `primary-800` | `#1e40af` | Dark backdrop blob |
| `primary-900` | `#1e3a8a` | Dark backdrop blob |

### 2.2 Neutrals

Tailwind `gray` is the only neutral scale.

| Role | Light | Dark |
| --- | --- | --- |
| Page base (`PageBackground`) | `gray-100` | `gray-950` |
| Heading / primary text | `gray-900` | `white` |
| Body text | `gray-700` / `gray-600` | `gray-200` / `gray-300` |
| Secondary / muted text | `gray-500` | `gray-400` |
| Disabled text | `gray-400` | `gray-500` |
| Divider (non-glass) | `gray-200` | `gray-700` |
| Input placeholder | `gray-500` | `gray-400` |
| Glass edge highlight | `white/60`–`white/80` | `white/10`–`white/[15%]` |

### 2.3 Semantic (status) colors

All semantic colors use the stock Tailwind scales; each has a light surface/text pair and a dark pair. Toast and inline `ErrorMessage` surfaces use the `.glass-alert-*` classes (§4.2).

| Status | Light surface / border | Light text | Dark surface / border | Dark text | Icon / progress |
| --- | --- | --- | --- | --- | --- |
| Success | `green-50/70` / `green-200` | `green-800` | `green-900/40` / `green-700` | `green-200` | `green-400` (bar `green-400`, dark `green-500`) |
| Error / danger | `red-50/70` / `red-200` | `red-800` (body `red-700`) | `red-900/40` / `red-700` | `red-200` (body `red-300`) | `red-400` |
| Warning | `yellow-50/70` / `yellow-200` | `yellow-800` | `yellow-900/40` / `yellow-700` | `yellow-200` | `yellow-400` |
| Info | `blue-50/70` / `blue-200` | `blue-800` | `blue-900/40` / `blue-700` | `blue-200` | `blue-400` |

Confirm / action fills are glass CTAs: danger = `.glass-button-danger` (`red-600/90`), warning = `.glass-button-warning` (`yellow-700/90`), success = `.glass-button-success` (`green-700/90`), info = `.glass-button-primary` (`primary-600/90`). Light fills are one step darker than the status hue's usual `-500`/`-600` so white text stays at WCAG AA (4.5:1); dark fills keep their lower alpha.

Markdown alerts (`.markdown-alert-*`) use a 4px left border: note = blue, tip = green, important = purple, warning = yellow, caution = red (`-500` light, `-400` dark; title text `-600` light, `-400` dark). Their body surface is translucent glass (`gray-50/70` light, `gray-900/40` dark, `backdrop-blur-md`, `shadow-sm`), matching `.glass-alert-neutral`; only the left border and title carry the type color.

### 2.4 Backdrop (what the glass blurs)

`PageBackground` renders fixed, blurred (`blur-3xl`) circles on the page base. Glass has nothing to show without them, so every page shell must include it.

| Blob | Light | Dark |
| --- | --- | --- |
| Top-left (34rem) | `primary-300/70` | `primary-600/40` |
| Top-right (36rem) | `primary-300/70` | `primary-800/50` |
| Bottom-left-center (30rem) | `primary-200/80` | `primary-900/50` |
| Bottom-right-center (24rem) | `gray-400/60` | `gray-700/40` |
| Center (32rem) | `primary-200/50` | `primary-700/30` |

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

Contrast rule: body and control text must reach WCAG AA (4.5:1) on the glass surface they sit on. The lightest allowed text on light glass is `gray-500`; on dark glass `gray-400`. `gray-400` on light and `gray-500` on dark are for disabled states only.

## 4. Glass system

All glass surfaces are shared `@layer components` classes in `index.css`. Use them; do not re-spell the utility strings. A glass surface = **translucent fill + 1px light edge + backdrop blur + soft shadow**.

### 4.1 Blur scale

| Tailwind | Radius | Used by |
| --- | --- | --- |
| `backdrop-blur-sm` | 4px | `.glass-checkbox`, `.glass-progress-track` |
| `backdrop-blur-md` | 12px | `.glass-button-primary/-success/-danger/-warning`, `.glass-input`, hover surface of nav buttons / header icon button |
| `backdrop-blur-lg` | 16px | `.glass-panel`, `.glass-panel-card`, `.glass-interactive` (on hover/focus) |
| `backdrop-blur-xl` | 24px | `.glass-panel-strong` |
| `blur-3xl` (filter, not backdrop) | 64px | `PageBackground` blobs only |
| chart tooltip | `6px` (inline style) / `backdrop-blur-md` | `chartGlassStyles` |

Higher blur = higher elevation in the layer stack (page → panel → card → overlay).

### 4.2 Surface tiers (opacity + border)

| Class | Light fill | Light border | Dark fill | Dark border | Blur | Shadow | Role |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `.glass-panel` | `white/[10%]` | `white/60` | `gray-800/[20%]` | `white/10` | `lg` | `sm` | Page content card, tab wrapper, large containers |
| `.glass-panel-card` | `white/[30%]` | `white/80` | `gray-800/[44%]` | `white/[15%]` | `lg` | `sm` | Per-record rows nested **inside** a `.glass-panel` (EntityCard, NoteCard, CollapsibleSection) |
| `.glass-panel-strong` | `white/[55%]` | `white/80` | `gray-800/[60%]` | `white/10` | `xl` | `sm` (Modal/Dialog add `shadow-xl`) | Header, Modal, ConfirmationDialog, DropdownMenu |
| `.glass-input` | `gray-100/70` | `white/70` | `gray-900/50` | `white/10` | `md` | `sm` | Text inputs / textareas / date pickers |
| `.glass-checkbox` | `white/30` (checked `primary-500/80`) | `white/70` (checked `primary-500`) | `white/10` (checked `primary-500/80`) | `white/20` (checked `primary-400`) | `sm` | `sm` | Native checkbox |
| `.glass-alert-*` (`success` / `error` / `warning` / `info` / `neutral`) | `*-50/70` | `*-200` | `*-900/40` | `*-700` | `md` | `sm` | Toast, inline `ErrorMessage` (text / icon colors set per usage) |
| `.glass-progress-track` | `white/20` | `white/30` | `gray-800/30` | `white/10` | `sm` | `inner` | Quiz progress track (fill stays solid primary) |
| `.glass-interactive` | transparent → `primary-500/[15%]` hover/focus, `/25` active | transparent | transparent → `primary-400/20` hover/focus, `/30` active | transparent | `lg` on hover/focus only | `sm` on hover/focus | Secondary buttons, icon buttons, back button |
| `.glass-button-primary` | `primary-600/90` (hover `primary-700/90`) | transparent | `primary-500/60` (hover `/75`) | transparent | `md` | `md` (dark `lg`) | Primary CTA, active filter / page |
| `.glass-button-success` | `green-700/90` (hover `green-800/90`) | transparent | `green-600/60` (hover `/75`) | transparent | `md` | `md` (dark `lg`) | Success / fetch CTA |
| `.glass-button-danger` | `red-600/90` (hover `red-700/90`) | transparent | `red-600/60` (hover `/75`) | transparent | `md` | `md` (dark `lg`) | `ConfirmationDialog` `danger` confirm |
| `.glass-button-warning` | `yellow-700/90` (hover `yellow-800/90`) | transparent | `yellow-600/60` (hover `/75`) | transparent | `md` | `md` (dark `lg`) | `ConfirmationDialog` `warning` confirm |

Layering invariants (documented in `index.css`; breaking them makes a surface vanish):

1. A panel tone must stay visibly different from the page base (light `gray-100`, dark `gray-950`). Blending a color onto an identical backdrop is a no-op.
2. A nested surface must be **less transparent (higher alpha)** than its container: `glass-panel` (10 / 20 %) < `glass-panel-card` (30 / 44 %) < `glass-panel-strong` (55 / 60 %).
3. A field must be more opaque than the modal it sits in (`glass-input` reads as a well).
4. Primary CTAs are far more opaque than `.glass-interactive`'s resting state so they stay the clearest action.

Dark vs light differences (summary): light glass is **white-tinted** with a bright white edge (`white/60–80`); dark glass is **gray-800/900-tinted** with a faint white edge (`white/10–15`). Dark fills use *higher* alpha than light for the same tier (20 vs 10, 44 vs 30, 60 vs 55) because dark backdrops are less luminous and need more fill to separate. Dark CTAs drop from `/90` to `/60` alpha so the blur and backdrop colors still read.

### 4.3 Overlays and non-glass surfaces

| Surface | Light | Dark |
| --- | --- | --- |
| Modal / dialog scrim | `bg-black/30` | `bg-black/30` (same) |
| Toast | `.glass-alert-{success,error,warning,info,neutral}` | same class |
| Inline `ErrorMessage` | `.glass-alert-error` | same class |
| Chart tooltip | frosted dark for **both** themes: `rgba(31,41,55,.85)`, border `rgba(255,255,255,.15)`, text `#f3f4f6`, blur 6px (recharts inline styles cannot read `dark:`) | same |
| Chart bars | stroke `rgba(255,255,255,.25)` @ 0.5px, fill opacity `0.85` | same |

## 5. Radius

| Token | px | Used by |
| --- | --- | --- |
| `rounded` | 4 | `.glass-checkbox`, scrollbar-picker icon |
| `rounded-md` | 6 | Buttons, inputs (`.glass-input`), dropdown panel, tabs' hover chips, header icon buttons, toast progress edge |
| `rounded-lg` | 8 | Panels, cards, modals, dialogs, toasts, error banners, logo |
| `rounded-r-md` | 6 (right only) | `.markdown-alert` |
| `rounded-full` | 9999 | Spinners, progress track, scrollbar thumb, icon bubbles, backdrop blobs |

Rule: controls = `md`, containers = `lg`, pills/circles = `full`. Nothing larger than `lg` is used on rectangular surfaces.

## 6. Shadow

Shadows are deliberately low-key so glass edges, not drop shadows, carry the depth.

| Token | Use |
| --- | --- |
| `shadow-sm` | Every glass tier at rest, inputs, checkbox |
| `shadow-inner` | Progress track |
| `shadow-md` (dark: `shadow-lg`) | Primary / success CTA |
| `shadow-lg` (hover `shadow-xl`) | Toast |
| `shadow-xl` | Modal and ConfirmationDialog panels |

Light vs dark: shadows are identical in light; in dark only the CTA steps up one level (`md` → `lg`) to stay visible against the dark backdrop.

## 7. Spacing and layout

- Page shell: `max-w-7xl` (Header) / `max-w-4xl` (detail pages); gutters `px-4 sm:px-6 lg:px-8` (Header), `px-4 sm:px-3 lg:px-10` (detail content).
- Header height `h-16`; panel padding `px-3`, growing to `lg:px-6` on large screens.
- Safe areas: root shell uses `pt-[env(safe-area-inset-top)]` and `pb-[max(1rem,env(safe-area-inset-bottom))]` (iOS standalone / `viewport-fit=cover`).
- Button padding: `px-4 py-2` (standard), `p-2` (icon-only, ≈36–40px), tab `py-4`.
- Responsive breakpoints are Tailwind defaults; phone width is the baseline (`sm` = 640px is where toasts leave the bottom edge and tab icons appear).

## 8. Motion

| Pattern | Duration / easing | Notes |
| --- | --- | --- |
| Color / surface transitions (`transition-colors`) | 200ms (Tailwind default easing) | Buttons, glass-interactive, tabs, menu items |
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
  - `.glass-interactive`: `focus-visible:` mirrors the hover tint (`primary-500/[15%]` light, `primary-400/20` dark) plus blur and shadow.
  - Pagination mobile buttons: `focus-visible:ring-2 focus-visible:ring-primary-500`.
- Use `focus-visible:ring-*`, not `focus:ring-*`, on buttons and other click targets: `focus:` also fires on mouse click and leaves a conspicuous ring on the clicked element. `focus:ring-*` is for text fields only (`.glass-input`, search bars, the markdown editor wrapper), where the ring should show on any focus. Do not add `ring-offset-*`.
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
| Secondary action | `.glass-interactive` + `rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300` |
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

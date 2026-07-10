---
applyTo: "**/*.tsx, **/*.jsx, **/*.vue, **/*.svelte, **/*.html, **/*.css, **/*.scss"
description: "Web accessibility review checklist (used by ksh-review)"
---

# Web accessibility checklist

- Semantic elements over `div`/`span` with click handlers (`button`, `a`,
  `nav`, `main`, headings in order).
- Every interactive element reachable by keyboard, with a visible focus state;
  no positive `tabindex`.
- Images have `alt` (empty `alt=""` for decorative); icon-only buttons have an
  accessible name.
- Form inputs have associated labels; errors are announced, not color-only.
- Text contrast at least 4.5:1 (3:1 for large text); state not conveyed by
  color alone.
- ARIA only when no native element fits; roles/states must be kept in sync.
- Dialogs/menus: focus moves in on open, returns on close, Escape closes.
- Respect `prefers-reduced-motion` for animation.

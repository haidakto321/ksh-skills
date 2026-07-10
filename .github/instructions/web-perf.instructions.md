---
applyTo: "**/*.ts, **/*.tsx, **/*.js, **/*.jsx, **/*.vue, **/*.svelte, **/*.html, **/*.css, **/*.scss"
description: "Web performance review checklist (used by ksh-review)"
---

# Web performance checklist

- Bundle: no heavyweight dependency for a small utility; code-split routes and
  rarely-used widgets (dynamic import).
- Images: sized (`width`/`height` or CSS aspect ratio, prevents CLS),
  modern format, lazy-load offscreen ones.
- No render-blocking scripts/styles added to the critical path; defer
  non-critical work.
- Core Web Vitals: LCP asset preloaded or server-rendered; no long
  main-thread tasks in interaction handlers (INP); reserve space for async
  content (CLS).
- Data fetching: no N+1 or request waterfalls a single call could serve;
  cache or memoize repeated fetches.
- React/Vue: no unstable props/keys causing re-render storms; memoize
  expensive computation, not everything.
- Static assets get cache headers / hashed filenames.

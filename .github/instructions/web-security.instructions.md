---
applyTo: "**/*.ts, **/*.tsx, **/*.js, **/*.jsx, **/*.vue, **/*.svelte, **/*.html"
description: "Web security review checklist (used by ksh-review; deep audit belongs to ksh-security)"
---

# Web security checklist

- XSS: no untrusted data into `innerHTML`, `dangerouslySetInnerHTML`, `v-html`,
  or template interpolation without sanitizing/escaping.
- Secrets: no API keys or tokens in client code; anything under `NEXT_PUBLIC_*`
  / `VITE_*` / `REACT_APP_*` ships to the browser.
- Auth cookies: `HttpOnly`, `Secure`, explicit `SameSite`; no tokens in
  `localStorage` when a cookie works.
- CSRF: state-changing endpoints protected (token or SameSite + method checks).
- CORS: no wildcard origin combined with credentials; allowlist origins.
- Injection: parameterized queries only; no string-built SQL / shell commands
  from request data.
- SSRF / redirects: validate URLs taken from user input before server-side
  fetch or redirect.
- Uploads: validate type and size server-side; never trust the client filename
  or MIME type.

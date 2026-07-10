---
name: ksh-security
description: "Use when a change touches auth, payments, user input, secrets, or network-exposed code - audits it with STRIDE and OWASP Top 10 checklists."
---

## Overview

Audits a change (or module) for security threats using two fixed frameworks: STRIDE for threat modeling and the OWASP Top 10 for concrete vulnerability classes. Fixed checklists force coverage - a free-form review only catches the vulnerabilities the reviewer happens to notice. Findings are severity-tagged, mapped to framework categories, and gated on a human fix-vs-accept-risk decision.

## When to Use

Use when the change touches auth/session logic, payments, file upload, raw user input parsing, secrets or crypto, or any network-exposed surface. In the `/ksh full` flow it runs after the review gate when one of those triggers applies. Also runs standalone via `/ksh-security` on a diff or a named module.

## Process

1. Scope: default is the current diff. If the user names a module or path,
   audit that instead. State the scope before starting.
2. STRIDE pass - walk all six categories against the scope and mark each one
   found / clear / N-A with one line of reasoning (never skip a category
   silently):
   - Spoofing: can an actor fake an identity here?
   - Tampering: can data or messages be modified in transit or at rest?
   - Repudiation: can an action be denied later (missing audit trail)?
   - Information disclosure: can data leak via logs, errors, or responses?
   - Denial of service: can crafted input or load break availability?
   - Elevation of privilege: can a user gain rights they should not have?
3. OWASP pass: map findings to OWASP Top 10 IDs (2021 edition, e.g. A01
   Broken Access Control, A03 Injection). Explicitly check injection, broken
   access control, security misconfiguration, and SSRF even if STRIDE found
   nothing. Note the edition in the report so IDs stay unambiguous when a
   newer Top 10 (e.g. 2025) is adopted.
4. Each finding: location + STRIDE category + OWASP ID + severity
   (HIGH / MED / LOW) + concrete fix.
5. Ask "Export security report to file?" If yes, write
   reports/security-<slug>-<date>.md with the full category disposition table
   and findings. Never write silently.
6. GATE (mandatory): present findings; the human decides fix vs accept-risk
   per finding. Never auto-fix silently, never auto-accept a risk.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "Review already covered security." | Review has security as one bullet; this is a category-by-category audit. Run it. |
| "Internal tool, nobody attacks it." | Internal surfaces leak and get escalated through. Walk the checklist. |
| "No findings, skip the report offer." | A clean audit is evidence too. Offer the export. |

## Red Flags

Marking a STRIDE category N-A without a reason, findings without a concrete fix, and fixing security issues without the human's decision all invalidate the audit. If the scope is too large to audit meaningfully, say so and ask to narrow it instead of skimming.

## Verification

All six STRIDE categories explicitly dispositioned with reasons, findings mapped to OWASP IDs with severity and a concrete fix, and the fix-vs-accept-risk gate honored for every finding.

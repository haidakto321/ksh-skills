## Overview

Reviews diffs for correctness bugs, security issues, and quality problems with severity tagging.

## When to Use

Use when gating a change before merge with structured findings.

## Process

1. Review the diff for correctness bugs, security issues, and quality problems.
   Each finding: location + severity (HIGH / MED / LOW) + concrete fix.
2. Mode:
   - full review (default / from /aisp full): ask "Export review report to
     file?"; if yes write reports/review-<slug>-<date>.md.
   - light review (from short / quick flow): fast pass, findings inline, no
     report file. Still produce findings.
3. GATE (mandatory): present findings, let the human decide fix-vs-merge.
   Never auto-merge.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "Looks fine, skip review." | Review is the cheapest bug catch. Run at least a light pass. |
| "I'll just merge, it's small." | Merge is the human's call at the gate. Stop and ask. |

## Red Flags

Auto-merging without human approval and uncaught security issues block safe delivery.

## Verification

Findings produced and the merge gate was honored.

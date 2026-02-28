---
description: Run a runtime accessibility audit using Playwright + axe-core or Lighthouse
argument-hint: [url]
allowed-tools: [Read, Glob, Grep, Bash]
---

# Runtime Accessibility Audit

Run an automated runtime accessibility audit against a live or local URL using browser-based tools.

## Arguments

$ARGUMENTS

If no URL is provided, prompt the user or attempt `http://localhost:3000`.

## Steps

1. Run the runtime audit script:
```bash
node "SKILL_DIR/../skills/a11y-audit/scripts/runtime-audit.js" "<url>" "$(pwd)"
```

2. The script will try tools in order of preference:
   - **Playwright + axe-core** (best coverage)
   - **Lighthouse CLI** (fallback)
   - If neither is available, it prints install instructions.

3. Present the results to the user, grouped by severity.

## Notes

- This requires the target URL to be accessible (e.g. dev server running).
- Install dependencies if needed: `npm install -D @axe-core/playwright playwright` or `npm install -g lighthouse`.
- Runtime audits catch issues that static analysis cannot: color contrast, focus order, dynamic ARIA states.

**This is read-only. Never modify project files.**

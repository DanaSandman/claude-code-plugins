---
description: Fix accessibility issues from the audit report
argument-hint: <issue-id | category | all>
allowed-tools: [Read, Glob, Grep, Bash, Write, Edit]
---

# Accessibility Fix

Fix accessibility issues identified by a previous `/a11y-audit` run.

## Arguments

$ARGUMENTS

Accepted values:
- **Issue ID**: `A11Y-001`, `A11Y-012` — fix a single issue
- **Category**: `semantics`, `names`, `images`, `forms`, `aria`, `keyboard`, `patterns` — fix all issues in that category
- **`all`** — fix every auto-fixable issue

If no argument is provided, prompt the user to choose.

## Steps

1. Verify `a11y-report.json` exists. If not, tell the user to run `/a11y-audit` first.

2. Dry-run first to show what will change:
```bash
node "SKILL_DIR/../skills/a11y-fix/scripts/apply-fix.js" "$(pwd)" "<filter>" --dry-run
```

3. After user confirms, apply:
```bash
node "SKILL_DIR/../skills/a11y-fix/scripts/apply-fix.js" "$(pwd)" "<filter>"
```

4. Present the fix-report.md summary.

## Safety Rules

- **Dynamic content issues are NEVER auto-fixed** — only recommend.
- Always show dry-run results before applying.
- Back up files before modifying (scripts handle this).
- Fixes use conservative aria-label / alt with TODO placeholders that require human review.

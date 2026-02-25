---
description: Fix SEO issues from the audit report
argument-hint: <issue-id | category | all>
allowed-tools: [Read, Glob, Grep, Bash, Write, Edit]
---

# SEO Fix

Fix SEO issues identified by a previous `/seo-audit` run.

## Arguments

$ARGUMENTS

Accepted values:
- **Issue ID**: `SEO-001`, `SEO-012` — fix a single issue
- **Category**: `title`, `meta-description`, `headings`, `semantic-html`, `images`, `internal-links` — fix all issues in that category
- **`all`** — fix every auto-fixable issue

If no argument is provided, prompt the user to choose.

## Steps

1. Verify `seo-report.json` exists. If not, tell the user to run `/seo-audit` first.

2. Dry-run first to show what will change:
```bash
node "SKILL_DIR/../skills/seo-fix/scripts/apply-fix.js" "$(pwd)" "<filter>" --dry-run
```

3. After user confirms, apply:
```bash
node "SKILL_DIR/../skills/seo-fix/scripts/apply-fix.js" "$(pwd)" "<filter>"
```

4. Present the fix-report.md summary.

## Safety Rules

- **Rendering fixes are NEVER auto-applied** — only recommend.
- Always show dry-run results before applying.
- Back up files before modifying (scripts handle this).

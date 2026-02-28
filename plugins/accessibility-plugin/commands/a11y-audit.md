---
description: Run a full accessibility audit on the current project
allowed-tools: [Read, Glob, Grep, Bash]
---

# Accessibility Audit

Run a complete WCAG 2.2 accessibility audit on the current project. Detect the framework automatically and scan all 8 categories:

1. Semantic HTML
2. Accessible names
3. Images
4. Forms
5. ARIA
6. Keyboard & focus
7. UI patterns (dialogs, tabs, menus)
8. Dynamic content (live regions)

## Steps

1. Detect framework:
```bash
node "SKILL_DIR/../skills/a11y-audit/scripts/detect-framework.js" "$(pwd)"
```

2. Run each scanner with the detected framework, collect all issues.

3. Write combined issues to a temp file and generate reports:
```bash
node "SKILL_DIR/../skills/a11y-audit/scripts/generate-report.js" "$(pwd)" /tmp/a11y-scan-results.json "<framework>"
```

4. Present the summary table to the user.

**CRITICAL: This is read-only. Never modify project files. Only create a11y-report.json and a11y-report.md.**

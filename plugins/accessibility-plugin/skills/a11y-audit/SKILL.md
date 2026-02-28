---
name: a11y-audit
description: >
  Audit frontend projects for accessibility issues. Use when the user asks to
  "audit accessibility", "check a11y", "scan for accessibility",
  "WCAG audit", "screen reader check", or wants to check
  their site for accessibility problems.
allowed-tools: Read, Glob, Grep, Bash
---

# Accessibility Audit Skill

You are performing a comprehensive accessibility audit of the user's frontend project. Your goal is to scan the entire project and generate a structured report covering all critical WCAG categories.

**CRITICAL RULE: This audit is READ-ONLY. You MUST NEVER modify any project files. You may only create the report files (`a11y-report.json` and `a11y-report.md`) in the project root.**

## Current Project State

- Working directory: !`pwd`
- Package info: !`cat package.json 2>/dev/null | head -5 || echo "No package.json found"`

## Step 1: Detect Framework

Run the framework detection script:

```bash
node "SKILL_DIR/scripts/detect-framework.js" "$(pwd)"
```

This outputs JSON with the detected framework (`nextjs`, `react`, `angular`, or `html`). Save this result — you will pass the framework name to all subsequent scan scripts.

## Step 2: Read Reference Guides

Read the relevant reference guides to inform your analysis:

- [reference/semantic-html-a11y-guide.md](reference/semantic-html-a11y-guide.md)
- [reference/aria-guide.md](reference/aria-guide.md)
- [reference/forms-a11y-guide.md](reference/forms-a11y-guide.md)
- [reference/keyboard-a11y-guide.md](reference/keyboard-a11y-guide.md)
- [reference/images-a11y-guide.md](reference/images-a11y-guide.md)
- [reference/patterns-a11y-guide.md](reference/patterns-a11y-guide.md)

## Step 3: Run All Scan Scripts

Run each scanner in sequence, passing the project root and detected framework:

```bash
node "SKILL_DIR/scripts/scan-semantics.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-names.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-images.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-forms.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-aria.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-keyboard.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-patterns.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-dynamic.js" "$(pwd)" "<framework>"
```

Collect all JSON results from each scanner.

## Step 4: Generate Reports

Pass all collected scan results to the report generator:

```bash
echo '<all-issues-json>' > /tmp/a11y-scan-results.json
node "SKILL_DIR/scripts/generate-report.js" "$(pwd)" /tmp/a11y-scan-results.json "<framework>"
```

This creates both `a11y-report.json` and `a11y-report.md` in the project root.

## Step 5: Present Summary

After the reports are generated, present the user with:

1. **Framework detected** and version
2. **Issue summary table** — count of issues per category and severity
3. **Top priority issues** — list critical/high severity issues first
4. **Auto-fixable count** — how many issues can be fixed automatically
5. **Report locations** — confirm both files were saved

## Categories Covered

All 8 categories MUST appear in the report, even if zero issues are found:

| Category | Script | What It Checks |
|----------|--------|----------------|
| Semantic HTML & Landmarks | scan-semantics.js | div onClick, heading structure, landmarks, button/link semantics |
| Accessible Names | scan-names.js | Buttons, links, SVGs, icon-only elements, empty aria-label |
| Images | scan-images.js | Missing alt, decorative images, role="img" |
| Forms | scan-forms.js | Missing labels, placeholder-as-label, fieldset/legend, error messages |
| ARIA Correctness | scan-aria.js | Redundant roles, aria-hidden on focusable, broken references |
| Keyboard & Focus | scan-keyboard.js | tabindex > 0, focus styles, keyboard handlers |
| UI Patterns | scan-patterns.js | Dialogs, tabs, menus — missing ARIA roles and states |
| Dynamic Content | scan-dynamic.js | Toasts, loading spinners, status messages — missing live regions |

## Issue Schema

Every issue object must follow this schema:

```json
{
  "id": "A11Y-001",
  "severity": "critical|high|medium|low",
  "framework": "nextjs|react|angular|html",
  "category": "semantics|accessible-names|images|forms|aria|keyboard|patterns|dynamic",
  "file": "relative/path/to/file.tsx",
  "line": 15,
  "problem": "Clear description of the issue",
  "impact": "How this affects users with disabilities",
  "recommendedFix": "Specific actionable fix",
  "autoFixPossible": true,
  "wcagCriteria": "4.1.2",
  "wcagLevel": "A"
}
```

## If Arguments Are Provided

$ARGUMENTS

If the user specifies a particular category or directory to scan, focus on that area but still generate the full report structure.

## Important Notes

- Do NOT skip any category in the report
- Do NOT modify any project files
- Scripts use Node.js built-in modules only — no npm install needed
- If a script fails, log the error and continue with remaining scans
- Always generate both JSON and Markdown reports

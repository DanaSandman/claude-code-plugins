# accessibility-plugin

A Claude Code plugin that audits and fixes WCAG 2.2 accessibility issues across all frontend frameworks.

## Supported Frameworks

- Next.js (App Router & Pages Router)
- React (SPA)
- Angular
- Static HTML

## Skills

### a11y-audit

Read-only scan that generates a complete accessibility audit report.

**Triggers**: "audit accessibility", "scan a11y", "check accessibility", "wcag audit", "generate a11y report"

**Output**: `a11y-report.json` and `a11y-report.md` in project root.

**Categories audited**:
- Semantic HTML (div onClick, heading hierarchy, landmarks, anchors)
- Accessible names (buttons, links, icons, SVGs, empty aria-label)
- Images (missing alt, decorative detection, Next.js Image, role="img")
- Forms (missing labels, placeholder-as-label, fieldset/legend, error containers)
- ARIA (redundant roles, aria-hidden on focusable, broken references, aria-expanded)
- Keyboard & focus (tabindex, focus styles, keyboard handlers, mouse-only events)
- UI patterns (dialogs, tabs, menu buttons)
- Dynamic content (live regions, toasts, spinners, status messages)

### a11y-fix

Applies conservative fixes to accessibility issues found by a11y-audit.

**Triggers**: "fix accessibility", "fix a11y", "fix issue", "fix all"

**Input**: Issue ID, category name, or "all"

**Output**: `fix-report.md` with fixed/skipped issues.

## Commands

| Command | Description |
|---------|-------------|
| `/a11y-audit` | Full project accessibility audit — generates reports |
| `/a11y-fix <target>` | Fix issues by ID, category, or all |
| `/a11y-check <file>` | Quick inline check on a single file |
| `/a11y-run [url]` | Runtime audit via Playwright + axe-core or Lighthouse |

## Hooks

The plugin includes a **PostToolUse hook** that runs automatically whenever Claude writes or edits a frontend file (`.html`, `.tsx`, `.jsx`, `.ts`, `.js`, `.vue`, `.svelte`). It checks for:

- `<img>` without `alt` attribute
- `<div>` with `onClick` but no `role`
- `<input>` / `<select>` / `<textarea>` without a label mechanism
- `aria-hidden` on focusable elements
- `tabindex` > 0
- Empty `aria-label` attributes

Warnings appear inline right after the edit — no action needed from you.

## Usage

### Run a full accessibility audit

```
/a11y-audit
```

Scans your entire project and generates two report files in the project root:
- `a11y-report.json` — structured data with all issues
- `a11y-report.md` — human-readable report with all 8 categories

Example output:

```
Framework detected: Next.js 14.x (App Router)

| Category             | Issues |
|----------------------|--------|
| Semantic HTML        | 2      |
| Accessible Names     | 3      |
| Images               | 2      |
| Forms                | 2      |
| ARIA                 | 1      |
| Keyboard & Focus     | 1      |
| UI Patterns          | 1      |
| Dynamic Content      | 1      |

Total: 13 issues (2 critical, 5 high, 4 medium, 2 low)
Reports saved to a11y-report.json and a11y-report.md
```

### Fix a specific issue by ID

```
/a11y-fix A11Y-003
```

Reads `a11y-report.json`, finds issue `A11Y-003`, and applies the fix if auto-fixable. If the issue is a dynamic content problem, it provides a recommendation instead.

### Fix all auto-fixable issues

```
/a11y-fix all
```

Applies all safe fixes across every category. Dynamic content issues are skipped (recommendation only). Generates `fix-report.md` with a summary of what was fixed, skipped, and what needs manual review.

### Fix all issues in a specific category

```
/a11y-fix semantics
/a11y-fix names
/a11y-fix images
/a11y-fix forms
/a11y-fix aria
/a11y-fix keyboard
/a11y-fix patterns
```

Targets only issues in the specified category.

### Quick check a single file

```
/a11y-check src/components/Header.tsx
/a11y-check src/app/page.tsx
/a11y-check index.html
```

Runs a fast inline accessibility check on the specified file without generating report files. Shows issues directly in the conversation.

### Runtime audit

```
/a11y-run http://localhost:3000
```

Runs browser-based accessibility testing using Playwright + axe-core (preferred) or Lighthouse CLI (fallback). Catches issues that static analysis cannot: color contrast, focus order, dynamic ARIA states.

## Auto-Fix Safety

Fixes are conservative and never guess at content:
- Labels use `"TODO: label"` or `"TODO: describe image"` placeholders
- Decorative images get `alt=""` based on filename/class hints
- `<div onClick>` → `<button type="button">` with closing tag tracking
- Files are backed up (`.bak`) before modification
- Dynamic content issues are **never** auto-fixed

## Requirements

- Node.js (uses built-in modules only, no npm install needed)
- Claude Code CLI
- For runtime audits: Playwright + axe-core or Lighthouse CLI (optional)

## Local Testing

```bash
claude --plugin-dir ./plugins/accessibility-plugin
```

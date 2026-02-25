# seo-plugin

A Claude Code plugin that audits and fixes technical SEO issues across all frontend frameworks.

## Supported Frameworks

- Next.js (App Router & Pages Router)
- React (SPA)
- Angular
- Static HTML

## Skills

### seo-audit

Read-only scan that generates a complete SEO audit report.

**Triggers**: "audit seo", "scan project", "analyze seo", "check rendering", "generate seo report"

**Output**: `seo-report.json` and `seo-report.md` in project root.

**Categories audited**:
- Rendering strategy (SSG/ISR/SSR/CSR analysis)
- Title tags
- Meta descriptions
- Heading structure
- Semantic HTML
- URL structure
- Image optimization
- Internal links

### seo-fix

Applies fixes to SEO issues found by seo-audit.

**Triggers**: "fix seo", "fix issue", "fix all", "fix rendering"

**Input**: Issue ID, category name, or "all"

**Output**: `fix-report.md` with fixed/skipped issues.

## Commands

| Command | Description |
|---------|-------------|
| `/seo-audit` | Full project SEO audit — generates reports |
| `/seo-fix <target>` | Fix issues by ID, category, or all |
| `/seo-check <file>` | Quick inline check on a single file |

## Hooks

The plugin includes a **PostToolUse hook** that runs automatically whenever Claude writes or edits a frontend file (`.html`, `.tsx`, `.jsx`, `.ts`, `.js`, `.vue`, `.svelte`). It checks for:

- `<img>` without `alt` attribute
- Multiple `<h1>` tags
- `"use client"` on page/layout files with SEO content
- Empty `<title>` tags

Warnings appear inline right after the edit — no action needed from you.

## Usage

### Run a full SEO audit

```
/seo-audit
```

Scans your entire project and generates two report files in the project root:
- `seo-report.json` — structured data with all issues
- `seo-report.md` — human-readable report with all 8 categories

Example output:

```
Framework detected: Next.js 14.x (App Router)

| Category        | Issues |
|-----------------|--------|
| Rendering       | 2      |
| Title           | 1      |
| Meta Description| 1      |
| Headings        | 0      |
| Semantic HTML   | 1      |
| URL Structure   | 0      |
| Images          | 3      |
| Internal Links  | 1      |

Total: 9 issues (1 critical, 3 high, 4 medium, 1 low)
Reports saved to seo-report.json and seo-report.md
```

### Fix a specific issue by ID

```
/seo-fix SEO-012
```

Reads `seo-report.json`, finds issue `SEO-012`, and applies the fix if auto-fixable. If the issue is a rendering problem, it provides a recommendation instead of auto-applying.

### Fix all auto-fixable issues

```
/seo-fix all
```

Applies all safe fixes across every category. Rendering issues are skipped (recommendation only). Generates `fix-report.md` with a summary of what was fixed, skipped, and what needs manual review.

### Fix all issues in a specific category

```
/seo-fix images
/seo-fix headings
/seo-fix title
/seo-fix meta-description
/seo-fix semantic-html
/seo-fix internal-links
```

Targets only issues in the specified category.

### Quick check a single file

```
/seo-check src/app/page.tsx
/seo-check src/components/Header.tsx
/seo-check index.html
```

Runs a fast inline SEO check on the specified file without generating report files. Shows issues directly in the conversation.

## Requirements

- Node.js (uses built-in modules only, no npm install needed)
- Claude Code CLI

## Local Testing

```bash
claude --plugin-dir ./plugins/seo-plugin
```

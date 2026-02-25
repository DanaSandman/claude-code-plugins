# universal-frontend-seo-plugin

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

## Usage

```
/universal-frontend-seo-plugin:seo-audit
/universal-frontend-seo-plugin:seo-fix all
/universal-frontend-seo-plugin:seo-fix SEO-001
/universal-frontend-seo-plugin:seo-fix images
```

## Requirements

- Node.js (uses built-in modules only, no npm install needed)
- Claude Code CLI

## Local Testing

```bash
claude --plugin-dir ./universal-frontend-seo-plugin
```

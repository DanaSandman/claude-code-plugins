---
name: seo-audit
description: >
  Audit frontend projects for SEO issues. Use when the user asks to
  "audit seo", "scan project", "analyze seo", "check rendering",
  "generate seo report", mentions SEO analysis, or wants to check
  their site for search engine optimization problems.
allowed-tools: Read, Glob, Grep, Bash
---

# SEO Audit Skill

You are performing a comprehensive SEO audit of the user's frontend project. Your goal is to scan the entire project and generate a structured SEO report covering all critical categories.

**CRITICAL RULE: This audit is READ-ONLY. You MUST NEVER modify any project files. You may only create the report files (`seo-report.json` and `seo-report.md`) in the project root.**

## Current Project State

- Working directory: !`pwd`
- Package info: !`cat package.json 2>/dev/null | head -5 || echo "No package.json found"`

## Step 1: Detect Framework

Run the framework detection script:

```bash
node "SKILL_DIR/scripts/detect-framework.js" "$(pwd)"
```

This outputs JSON with the detected framework (`nextjs`, `react`, `angular`, or `html`). Save this result — you will pass the framework name to all subsequent scan scripts.

If framework detection fails, ask the user to confirm their framework.

## Step 2: Read Framework Reference Guide

Based on the detected framework, read the appropriate reference guide to inform your analysis:

- Next.js → [reference/nextjs-rendering-guide.md](reference/nextjs-rendering-guide.md)
- React → [reference/react-seo-guide.md](reference/react-seo-guide.md)
- Angular → [reference/angular-seo-guide.md](reference/angular-seo-guide.md)
- Static HTML → [reference/html-seo-guide.md](reference/html-seo-guide.md)

Also read these universal guides:
- [reference/metadata-guide.md](reference/metadata-guide.md)
- [reference/semantic-html-guide.md](reference/semantic-html-guide.md)
- [reference/image-seo-guide.md](reference/image-seo-guide.md)
- [reference/internal-linking-guide.md](reference/internal-linking-guide.md)
- [reference/url-structure-guide.md](reference/url-structure-guide.md)

## Step 3: Run All Scan Scripts

Run each scanner in sequence, passing the project root and detected framework. Each script outputs JSON with an `issues` array.

```bash
node "SKILL_DIR/scripts/scan-rendering.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-title.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-meta.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-headings.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-semantic.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-url.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-images.js" "$(pwd)" "<framework>"
node "SKILL_DIR/scripts/scan-links.js" "$(pwd)" "<framework>"
```

Collect all JSON results from each scanner.

## Step 4: Generate Reports

Pass all collected scan results to the report generator. Write the combined JSON array of all issues to a temp file, then run:

```bash
echo '<all-issues-json>' > /tmp/seo-scan-results.json
node "SKILL_DIR/scripts/generate-report.js" "$(pwd)" /tmp/seo-scan-results.json "<framework>"
```

This creates both `seo-report.json` and `seo-report.md` in the project root.

## Step 5: Present Summary

After the reports are generated, present the user with:

1. **Framework detected** and version
2. **Issue summary table** — count of issues per category and severity
3. **Critical issues** — list any critical/high severity issues first
4. **Report locations** — confirm both files were saved

Use the example report at [assets/example-seo-report.md](assets/example-seo-report.md) as a formatting reference.

## Categories Covered

All 8 categories MUST appear in the report, even if zero issues are found:

| Category | Script | What It Checks |
|----------|--------|----------------|
| Rendering | scan-rendering.js | SSG/ISR/SSR/CSR strategy, client component usage |
| Title | scan-title.js | Missing/duplicate title tags |
| Meta Description | scan-meta.js | Missing/duplicate/short/long meta descriptions |
| Headings | scan-headings.js | H1 count, heading hierarchy |
| Semantic HTML | scan-semantic.js | Landmark elements, div-itis |
| URL Structure | scan-url.js | Route naming, SEO-friendly slugs |
| Images | scan-images.js | Alt attributes, framework image component usage |
| Internal Links | scan-links.js | Link component usage, broken links |

## Issue Schema

Every issue object must follow this schema:

```json
{
  "id": "SEO-001",
  "severity": "critical|high|medium|low",
  "framework": "nextjs|react|angular|html",
  "category": "rendering|title|meta-description|headings|semantic-html|url-structure|images|internal-links",
  "file": "relative/path/to/file.tsx",
  "line": 15,
  "problem": "Clear description of the issue",
  "seoImpact": "How this affects search engine ranking",
  "recommendedFix": "Specific actionable fix",
  "autoFixPossible": true
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

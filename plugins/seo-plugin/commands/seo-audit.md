---
description: Run a full SEO audit on the current project
allowed-tools: [Read, Glob, Grep, Bash]
---

# SEO Audit

Run a complete SEO audit on the current project. Detect the framework automatically and scan all 8 categories:

1. Rendering strategy
2. Title tags
3. Meta descriptions
4. Heading structure
5. Semantic HTML
6. URL structure
7. Image optimization
8. Internal links

## Steps

1. Detect framework:
```bash
node "SKILL_DIR/../skills/seo-audit/scripts/detect-framework.js" "$(pwd)"
```

2. Run each scanner with the detected framework, collect all issues.

3. Write combined issues to a temp file and generate reports:
```bash
node "SKILL_DIR/../skills/seo-audit/scripts/generate-report.js" "$(pwd)" /tmp/seo-scan-results.json "<framework>"
```

4. Present the summary table to the user.

**CRITICAL: This is read-only. Never modify project files. Only create seo-report.json and seo-report.md.**

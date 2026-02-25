---
description: Quick SEO check on a specific file or directory
argument-hint: <file-or-directory>
allowed-tools: [Read, Glob, Grep, Bash]
---

# SEO Quick Check

Run a targeted SEO check on a specific file or directory instead of the full project.

## Arguments

$ARGUMENTS

If no argument is provided, check the current file open in the editor or prompt the user.

## Steps

1. Detect framework:
```bash
node "SKILL_DIR/../skills/seo-audit/scripts/detect-framework.js" "$(pwd)"
```

2. Determine the target file or directory from the arguments.

3. Read the target file(s) and check for:
   - Missing or duplicate title/meta description
   - Heading hierarchy issues (multiple H1, skipped levels)
   - Missing alt attributes on images
   - Native `<img>` instead of framework Image component
   - Native `<a>` instead of framework Link component
   - Missing semantic HTML landmarks
   - `"use client"` on pages with SEO content (Next.js)

4. Present findings inline — no report files generated. Just show the issues directly to the user in a concise list.

**This is read-only. Never modify files.**

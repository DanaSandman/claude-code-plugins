---
description: Quick accessibility check on a specific file or directory
argument-hint: <file-or-directory>
allowed-tools: [Read, Glob, Grep, Bash]
---

# Accessibility Quick Check

Run a targeted accessibility check on a specific file or directory instead of the full project.

## Arguments

$ARGUMENTS

If no argument is provided, check the current file open in the editor or prompt the user.

## Steps

1. Detect framework:
```bash
node "SKILL_DIR/../skills/a11y-audit/scripts/detect-framework.js" "$(pwd)"
```

2. Determine the target file or directory from the arguments.

3. Read the target file(s) and check for:
   - `<img>` without alt attribute
   - Buttons/links with no accessible name
   - `<div>` / `<span>` with onClick but no role or keyboard handler
   - Inputs without associated labels
   - Empty aria-label attributes
   - tabindex > 0
   - aria-hidden on focusable elements
   - Dialogs missing role="dialog" or aria-modal
   - Missing heading hierarchy
   - Placeholder used as only label

4. Present findings inline — no report files generated. Just show the issues directly to the user in a concise list.

**This is read-only. Never modify files.**

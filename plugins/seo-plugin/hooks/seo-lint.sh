#!/bin/bash
# seo-lint.sh
# Quick SEO lint check run after Claude edits frontend files.
# Checks for the most common SEO mistakes and warns immediately.
# Exit 0 = pass (no blocking), output warnings to stdout.

FILE="$1"

if [ -z "$FILE" ]; then
  exit 0
fi

# Only check frontend files
case "$FILE" in
  *.html|*.htm|*.tsx|*.jsx|*.ts|*.js|*.vue|*.svelte) ;;
  *) exit 0 ;;
esac

# Skip node_modules, dist, build, .next
case "$FILE" in
  */node_modules/*|*/dist/*|*/build/*|*/.next/*) exit 0 ;;
esac

if [ ! -f "$FILE" ]; then
  exit 0
fi

CONTENT=$(cat "$FILE")
WARNINGS=""

# Check for <img> without alt
if echo "$CONTENT" | grep -qiP '<img\s(?![^>]*\balt\s*=)'; then
  WARNINGS="${WARNINGS}\n⚠ SEO: <img> tag without alt attribute found"
fi

# Check for multiple H1 tags
H1_COUNT=$(echo "$CONTENT" | grep -ciP '<h1[\s>]')
if [ "$H1_COUNT" -gt 1 ]; then
  WARNINGS="${WARNINGS}\n⚠ SEO: Multiple H1 tags found ($H1_COUNT). Only one H1 per page is recommended"
fi

# Check for "use client" in page/layout files with SEO content
BASENAME=$(basename "$FILE")
case "$BASENAME" in
  page.tsx|page.jsx|page.ts|page.js|layout.tsx|layout.jsx|layout.ts|layout.js)
    if echo "$CONTENT" | grep -q "'use client'\|\"use client\""; then
      if echo "$CONTENT" | grep -qiP '<h1|metadata|generateMetadata|<title|<meta'; then
        WARNINGS="${WARNINGS}\n⚠ SEO: 'use client' directive on page/layout with SEO-critical content. Consider using Server Components"
      fi
    fi
    ;;
esac

# Check for empty <title> tag
if echo "$CONTENT" | grep -qiP '<title[^>]*>\s*</title>'; then
  WARNINGS="${WARNINGS}\n⚠ SEO: Empty <title> tag found"
fi

# Output warnings if any
if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS"
fi

exit 0

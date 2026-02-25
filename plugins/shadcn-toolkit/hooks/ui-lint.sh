#!/bin/bash
# ui-lint.sh
# Quick UI component lint after Claude edits React/Next.js files.
# Checks for common component quality issues.
# Exit 0 = pass, warnings to stdout.

FILE="$1"

if [ -z "$FILE" ]; then
  exit 0
fi

# Only check React/Next.js component files
case "$FILE" in
  *.tsx|*.jsx) ;;
  *) exit 0 ;;
esac

# Skip node_modules, dist, .next
case "$FILE" in
  */node_modules/*|*/dist/*|*/.next/*) exit 0 ;;
esac

if [ ! -f "$FILE" ]; then
  exit 0
fi

CONTENT=$(cat "$FILE")
WARNINGS=""

# Check for hardcoded hex/rgb colors instead of Tailwind classes or CSS variables
if echo "$CONTENT" | grep -qP "style=\{.*?(#[0-9a-fA-F]{3,8}|rgb\(|rgba\()"; then
  WARNINGS="${WARNINGS}\n⚠ UI: Hardcoded color in inline style. Use Tailwind classes or CSS variables instead"
fi

# Check for <button> without type attribute
if echo "$CONTENT" | grep -qP '<button(?![^>]*\btype\s*=)'; then
  WARNINGS="${WARNINGS}\n⚠ UI: <button> without type attribute. Add type=\"button\" or type=\"submit\""
fi

# Check for <img> without alt (accessibility)
if echo "$CONTENT" | grep -qiP '<img\s(?![^>]*\balt\s*=)'; then
  WARNINGS="${WARNINGS}\n⚠ UI: <img> without alt attribute. Add descriptive alt text for accessibility"
fi

# Check for onClick on non-interactive elements (div, span)
if echo "$CONTENT" | grep -qP '<(div|span)\s[^>]*onClick'; then
  WARNINGS="${WARNINGS}\n⚠ UI: onClick on <div>/<span>. Use <button> or add role=\"button\" and tabIndex={0} for accessibility"
fi

# Check for missing 'use client' when using hooks
if echo "$CONTENT" | grep -qP '\b(useState|useEffect|useRef|useCallback|useMemo|useContext)\b'; then
  if ! echo "$CONTENT" | grep -q "'use client'\|\"use client\""; then
    WARNINGS="${WARNINGS}\n⚠ UI: React hooks used without 'use client' directive"
  fi
fi

# Check for className string concatenation instead of cn()
if echo "$CONTENT" | grep -qP 'className=\{`[^`]*\$\{'; then
  WARNINGS="${WARNINGS}\n⚠ UI: Template literal for className. Consider using cn() from @/lib/utils for cleaner conditional classes"
fi

# Output warnings if any
if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS"
fi

exit 0

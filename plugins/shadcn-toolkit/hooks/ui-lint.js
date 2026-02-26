#!/usr/bin/env node
// ui-lint.js
// Quick UI component lint after Claude edits React/Next.js files.
// Checks for common component quality issues.
// Exit 0 = pass, warnings to stdout.

const fs = require("fs");
const path = require("path");

const file = process.argv[2];

if (!file) {
  process.exit(0);
}

// Only check React/Next.js component files
const ext = path.extname(file);
if (![".tsx", ".jsx"].includes(ext)) {
  process.exit(0);
}

// Skip node_modules, dist, .next
if (/[/\\](node_modules|dist|\.next)[/\\]/.test(file)) {
  process.exit(0);
}

if (!fs.existsSync(file)) {
  process.exit(0);
}

const content = fs.readFileSync(file, "utf8");
const warnings = [];

// Check for hardcoded hex/rgb colors instead of Tailwind classes or CSS variables
if (/style=\{.*?(#[0-9a-fA-F]{3,8}|rgb\(|rgba\()/.test(content)) {
  warnings.push("⚠ UI: Hardcoded color in inline style. Use Tailwind classes or CSS variables instead");
}

// Check for <button> without type attribute
if (/<button(?![^>]*\btype\s*=)/.test(content)) {
  warnings.push('⚠ UI: <button> without type attribute. Add type="button" or type="submit"');
}

// Check for <img> without alt (accessibility)
if (/<img\s(?![^>]*\balt\s*=)/i.test(content)) {
  warnings.push("⚠ UI: <img> without alt attribute. Add descriptive alt text for accessibility");
}

// Check for onClick on non-interactive elements (div, span)
if (/<(div|span)\s[^>]*onClick/.test(content)) {
  warnings.push('⚠ UI: onClick on <div>/<span>. Use <button> or add role="button" and tabIndex={0} for accessibility');
}

// Check for missing 'use client' when using hooks
if (/\b(useState|useEffect|useRef|useCallback|useMemo|useContext)\b/.test(content)) {
  if (!/['"]use client['"]/.test(content)) {
    warnings.push("⚠ UI: React hooks used without 'use client' directive");
  }
}

// Check for className string concatenation instead of cn()
if (/className=\{`[^`]*\$\{/.test(content)) {
  warnings.push("⚠ UI: Template literal for className. Consider using cn() from @/lib/utils for cleaner conditional classes");
}

// Output warnings if any
if (warnings.length > 0) {
  console.log(warnings.join("\n"));
}

process.exit(0);

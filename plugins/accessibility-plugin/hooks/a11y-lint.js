#!/usr/bin/env node
// a11y-lint.js
// Quick accessibility lint check run after Claude edits frontend files.
// Checks for the most common a11y mistakes and warns immediately.
// Exit 0 = pass (no blocking), output warnings to stdout.

const fs = require("fs");
const path = require("path");

const file = process.argv[2];

if (!file) {
  process.exit(0);
}

// Only check frontend files
const frontendExtensions = [".html", ".htm", ".tsx", ".jsx", ".ts", ".js", ".vue", ".svelte"];
const ext = path.extname(file);
if (!frontendExtensions.includes(ext)) {
  process.exit(0);
}

// Skip node_modules, dist, build, .next
if (/[/\\](node_modules|dist|build|\.next)[/\\]/.test(file)) {
  process.exit(0);
}

if (!fs.existsSync(file)) {
  process.exit(0);
}

const content = fs.readFileSync(file, "utf8");
const warnings = [];

// Check for <img> without alt
if (/<img\s(?![^>]*\balt\s*=)/i.test(content)) {
  warnings.push("\u26a0 A11Y: <img> tag without alt attribute found (WCAG 1.1.1)");
}

// Check for div/span with onClick but no role or keyboard handler
const divOnClickPattern = /<(div|span)\s[^>]*onClick/gi;
let match;
while ((match = divOnClickPattern.exec(content)) !== null) {
  const tag = content.substring(match.index, content.indexOf(">", match.index) + 1);
  const hasRole = /\brole\s*=/.test(tag);
  const hasKeyHandler = /\b(onKeyDown|onKeyUp|onKeyPress)\s*=/.test(tag);
  if (!hasRole && !hasKeyHandler) {
    warnings.push(`\u26a0 A11Y: <${match[1]}> with onClick but no role or keyboard handler. Use <button> instead`);
    break; // one warning is enough
  }
}

// Check for inputs without associated labels
const inputPattern = /<(input|select|textarea)\s[^>]*>/gi;
while ((match = inputPattern.exec(content)) !== null) {
  const tag = match[0];
  const hasId = /\bid\s*=\s*["']([^"']+)["']/.test(tag);
  const hasAriaLabel = /\baria-label\s*=/.test(tag);
  const hasAriaLabelledBy = /\baria-labelledby\s*=/.test(tag);
  const isHidden = /\btype\s*=\s*["']hidden["']/.test(tag);
  if (!isHidden && !hasAriaLabel && !hasAriaLabelledBy) {
    if (hasId) {
      const idMatch = tag.match(/\bid\s*=\s*["']([^"']+)["']/);
      if (idMatch && !content.includes(`htmlFor="${idMatch[1]}"`) && !content.includes(`for="${idMatch[1]}"`)) {
        warnings.push(`\u26a0 A11Y: <${match[1]}> has no associated <label> (WCAG 1.3.1)`);
        break;
      }
    } else {
      warnings.push(`\u26a0 A11Y: <${match[1]}> missing label — add aria-label or associated <label> (WCAG 1.3.1)`);
      break;
    }
  }
}

// Check for aria-hidden on focusable elements
if (/aria-hidden\s*=\s*["']true["'][^>]*(tabindex|href\s*=|<button|<a\s|<input)/i.test(content)) {
  warnings.push("\u26a0 A11Y: aria-hidden=\"true\" applied to or near focusable element (WCAG 4.1.2)");
}

// Check for tabindex > 0
const tabindexPattern = /tabindex\s*=\s*["']?(\d+)["']?/gi;
while ((match = tabindexPattern.exec(content)) !== null) {
  if (parseInt(match[1], 10) > 0) {
    warnings.push("\u26a0 A11Y: tabindex > 0 found — this disrupts natural focus order (WCAG 2.4.3)");
    break;
  }
}

// Check for empty aria-label
if (/aria-label\s*=\s*["']\s*["']/i.test(content)) {
  warnings.push("\u26a0 A11Y: Empty aria-label found — element has no accessible name (WCAG 4.1.2)");
}

// Output warnings if any
if (warnings.length > 0) {
  console.log(warnings.join("\n"));
}

process.exit(0);

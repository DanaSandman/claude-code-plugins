#!/usr/bin/env node
// seo-lint.js
// Quick SEO lint check run after Claude edits frontend files.
// Checks for the most common SEO mistakes and warns immediately.
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
  warnings.push("⚠ SEO: <img> tag without alt attribute found");
}

// Check for multiple H1 tags
const h1Count = (content.match(/<h1[\s>]/gi) || []).length;
if (h1Count > 1) {
  warnings.push(`⚠ SEO: Multiple H1 tags found (${h1Count}). Only one H1 per page is recommended`);
}

// Check for "use client" in page/layout files with SEO content
const basename = path.basename(file);
const pageLayoutFiles = [
  "page.tsx", "page.jsx", "page.ts", "page.js",
  "layout.tsx", "layout.jsx", "layout.ts", "layout.js",
];
if (pageLayoutFiles.includes(basename)) {
  if (/['"]use client['"]/.test(content)) {
    if (/<h1|metadata|generateMetadata|<title|<meta/i.test(content)) {
      warnings.push("⚠ SEO: 'use client' directive on page/layout with SEO-critical content. Consider using Server Components");
    }
  }
}

// Check for empty <title> tag
if (/<title[^>]*>\s*<\/title>/i.test(content)) {
  warnings.push("⚠ SEO: Empty <title> tag found");
}

// Check for duplicate GTM installation
const gtmScriptCount = (content.match(/googletagmanager\.com\/gtm\.js/g) || []).length;
if (gtmScriptCount > 1) {
  warnings.push(`⚠ SEO: Duplicate GTM script tags found (${gtmScriptCount}). Only one GTM installation per page`);
}

// Output warnings if any
if (warnings.length > 0) {
  console.log(warnings.join("\n"));
}

process.exit(0);

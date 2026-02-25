#!/usr/bin/env node
/**
 * apply-render-fix.js
 * Rendering fix recommendations only — NEVER auto-applies changes.
 * Usage: node apply-render-fix.js '<issue-json>' [project-root]
 * Output: JSON { success: false, reason: "..." }
 */

const issue = JSON.parse(process.argv[2]);
const projectRoot = process.argv[3] || process.cwd();

// Rendering fixes are NEVER auto-applied
console.log(JSON.stringify({
  success: false,
  reason: `Rendering fixes require manual review. Recommendation: ${issue.recommendedFix}`
}));

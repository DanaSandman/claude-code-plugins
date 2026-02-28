#!/usr/bin/env node
/**
 * apply-aria-fix.js
 * Fixes ARIA correctness issues.
 * Usage: node apply-aria-fix.js '<issue-json>' [project-root]
 * Output: JSON { success: boolean, action?: string, reason?: string }
 */

const fs = require('fs');
const path = require('path');

const issue = JSON.parse(process.argv[2]);
const projectRoot = process.argv[3] || process.cwd();

function applyFix() {
  const filePath = path.join(projectRoot, issue.file);
  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const problem = issue.problem || '';

  // Only fix redundant roles — all other ARIA issues require manual review
  if (problem.includes('Redundant role')) {
    return fixRedundantRole(filePath, content);
  }

  return { success: false, reason: 'This ARIA issue requires manual review.' };
}

function fixRedundantRole(filePath, content) {
  const lines = content.split('\n');
  const targetLine = issue.line ? issue.line - 1 : -1;

  if (targetLine < 0 || targetLine >= lines.length) {
    return { success: false, reason: 'Could not locate the issue line.' };
  }

  const line = lines[targetLine];

  // Extract the redundant role from the problem description
  const roleMatch = issue.problem.match(/role="([^"]+)"/);
  if (!roleMatch) {
    return { success: false, reason: 'Could not determine redundant role value.' };
  }

  const redundantRole = roleMatch[1];
  const rolePattern = new RegExp(`\\s*role\\s*=\\s*["']${redundantRole}["']`, 'g');

  if (!rolePattern.test(line)) {
    return { success: false, reason: `role="${redundantRole}" not found on line ${issue.line}.` };
  }

  const newLine = line.replace(rolePattern, '');
  lines[targetLine] = newLine;

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Removed redundant role="${redundantRole}" from ${issue.file} line ${issue.line}.` };
}

try {
  const result = applyFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}

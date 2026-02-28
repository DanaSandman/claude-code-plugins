#!/usr/bin/env node
/**
 * apply-keyboard-fix.js
 * Fixes keyboard accessibility issues.
 * Usage: node apply-keyboard-fix.js '<issue-json>' [project-root]
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

  if (problem.includes('tabindex') && problem.includes('positive')) {
    return fixPositiveTabindex(filePath, content);
  }

  if (problem.includes('tabindex') && problem.includes('not keyboard-focusable')) {
    return addTabindex(filePath, content);
  }

  return { success: false, reason: 'This keyboard issue requires manual review.' };
}

function fixPositiveTabindex(filePath, content) {
  const lines = content.split('\n');
  const targetLine = issue.line ? issue.line - 1 : -1;

  if (targetLine < 0 || targetLine >= lines.length) {
    return { success: false, reason: 'Could not locate the issue line.' };
  }

  const line = lines[targetLine];
  const tabindexPattern = /tabindex\s*=\s*["']?\d+["']?/;

  if (!tabindexPattern.test(line)) {
    return { success: false, reason: 'tabindex not found on target line.' };
  }

  const newLine = line.replace(tabindexPattern, 'tabindex="0"');
  lines[targetLine] = newLine;

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Changed positive tabindex to tabindex="0" in ${issue.file} line ${issue.line}.` };
}

function addTabindex(filePath, content) {
  const lines = content.split('\n');
  const targetLine = issue.line ? issue.line - 1 : -1;

  if (targetLine < 0 || targetLine >= lines.length) {
    return { success: false, reason: 'Could not locate the issue line.' };
  }

  const line = lines[targetLine];

  // Already has tabindex
  if (/tabindex\s*=/.test(line)) {
    return { success: false, reason: 'Element already has tabindex.' };
  }

  // Add tabindex="0" after the tag name
  const tagMatch = line.match(/<(div|span)\s/);
  if (!tagMatch) {
    return { success: false, reason: 'Could not find div/span tag on target line.' };
  }

  const insertPos = line.indexOf(tagMatch[0]) + tagMatch[0].length;
  const newLine = line.slice(0, insertPos) + 'tabindex="0" ' + line.slice(insertPos);
  lines[targetLine] = newLine;

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Added tabindex="0" to element in ${issue.file} line ${issue.line}.` };
}

try {
  const result = applyFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}

#!/usr/bin/env node
/**
 * apply-forms-fix.js
 * Fixes form accessibility issues.
 * Usage: node apply-forms-fix.js '<issue-json>' [project-root]
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
  const lines = content.split('\n');
  const lineIdx = issue.line ? issue.line - 1 : -1;
  const problem = issue.problem || '';

  if (lineIdx < 0 || lineIdx >= lines.length) {
    return { success: false, reason: 'Could not locate the issue line.' };
  }

  // Placeholder used as only label
  if (problem.includes('placeholder as its only label')) {
    return fixPlaceholderLabel(filePath, content, lines, lineIdx);
  }

  // No associated label
  if (problem.includes('no associated label')) {
    return fixNoLabel(filePath, content, lines, lineIdx);
  }

  return { success: false, reason: 'This form issue requires manual review.' };
}

function fixPlaceholderLabel(filePath, content, lines, lineIdx) {
  const line = lines[lineIdx];
  const formMatch = line.match(/<(input|select|textarea)\s/i);
  if (!formMatch) {
    return { success: false, reason: 'Could not find form element on target line.' };
  }

  const tagStart = formMatch.index;
  const tagEnd = line.indexOf('>', tagStart);
  const tag = line.substring(tagStart, tagEnd + 1);

  if (/aria-label\s*=\s*["'][^"']+["']/.test(tag)) {
    return { success: false, reason: 'Element already has an aria-label.' };
  }

  // Extract placeholder value
  const phMatch = tag.match(/placeholder\s*=\s*["']([^"']+)["']/);
  const label = phMatch ? phMatch[1] : 'TODO: label';

  const insertPos = formMatch.index + formMatch[0].length;
  lines[lineIdx] = line.slice(0, insertPos) + `aria-label="${label}" ` + line.slice(insertPos);

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Added aria-label="${label}" to <${formMatch[1]}> in ${issue.file} line ${issue.line}.` };
}

function fixNoLabel(filePath, content, lines, lineIdx) {
  const line = lines[lineIdx];
  const formMatch = line.match(/<(input|select|textarea)\s/i);
  if (!formMatch) {
    return { success: false, reason: 'Could not find form element on target line.' };
  }

  const tagStart = formMatch.index;
  const tagEnd = line.indexOf('>', tagStart);
  const tag = line.substring(tagStart, tagEnd + 1);

  if (/aria-label\s*=\s*["'][^"']+["']/.test(tag) || /aria-labelledby\s*=/.test(tag)) {
    return { success: false, reason: 'Element already has a label mechanism.' };
  }

  const insertPos = formMatch.index + formMatch[0].length;
  lines[lineIdx] = line.slice(0, insertPos) + 'aria-label="TODO: label" ' + line.slice(insertPos);

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Added aria-label="TODO: label" to <${formMatch[1]}> in ${issue.file} line ${issue.line}. Please add a proper label.` };
}

try {
  const result = applyFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}

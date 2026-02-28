#!/usr/bin/env node
/**
 * apply-patterns-fix.js
 * Fixes UI pattern accessibility issues (dialogs, modals).
 * Usage: node apply-patterns-fix.js '<issue-json>' [project-root]
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

  if (problem.includes('missing role="dialog"')) {
    return addDialogRole(filePath, content);
  }

  if (problem.includes('missing aria-modal')) {
    return addAriaModal(filePath, content);
  }

  if (problem.includes('missing accessible title')) {
    return addDialogTitle(filePath, content);
  }

  return { success: false, reason: 'This pattern issue requires manual review.' };
}

function addDialogRole(filePath, content) {
  const lines = content.split('\n');
  const targetLine = issue.line ? issue.line - 1 : -1;

  if (targetLine < 0 || targetLine >= lines.length) {
    return { success: false, reason: 'Could not locate the issue line.' };
  }

  const line = lines[targetLine];

  // Already has role
  if (/\brole\s*=/.test(line)) {
    return { success: false, reason: 'Element already has a role attribute.' };
  }

  // Find the tag opening and add role="dialog" aria-modal="true"
  const tagMatch = line.match(/<(div|section)\s/);
  if (!tagMatch) {
    return { success: false, reason: 'Could not find container tag on target line.' };
  }

  const insertPos = line.indexOf(tagMatch[0]) + tagMatch[0].length;
  const newLine = line.slice(0, insertPos) + 'role="dialog" aria-modal="true" ' + line.slice(insertPos);
  lines[targetLine] = newLine;

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Added role="dialog" aria-modal="true" to modal in ${issue.file} line ${issue.line}.` };
}

function addAriaModal(filePath, content) {
  const lines = content.split('\n');
  const targetLine = issue.line ? issue.line - 1 : -1;

  if (targetLine < 0 || targetLine >= lines.length) {
    return { success: false, reason: 'Could not locate the issue line.' };
  }

  const line = lines[targetLine];

  if (/aria-modal\s*=/.test(line)) {
    return { success: false, reason: 'Element already has aria-modal.' };
  }

  // Insert aria-modal="true" after role="dialog"
  const roleMatch = line.match(/role\s*=\s*["'](dialog|alertdialog)["']/);
  if (roleMatch) {
    const insertPos = line.indexOf(roleMatch[0]) + roleMatch[0].length;
    const newLine = line.slice(0, insertPos) + ' aria-modal="true"' + line.slice(insertPos);
    lines[targetLine] = newLine;
  } else {
    return { success: false, reason: 'Could not find role="dialog" on target line.' };
  }

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Added aria-modal="true" to dialog in ${issue.file} line ${issue.line}.` };
}

function addDialogTitle(filePath, content) {
  const lines = content.split('\n');
  const targetLine = issue.line ? issue.line - 1 : -1;

  if (targetLine < 0 || targetLine >= lines.length) {
    return { success: false, reason: 'Could not locate the issue line.' };
  }

  const line = lines[targetLine];

  if (/aria-label\s*=/.test(line) || /aria-labelledby\s*=/.test(line)) {
    return { success: false, reason: 'Element already has an accessible name.' };
  }

  // Find role="dialog" and add aria-label after it
  const roleMatch = line.match(/role\s*=\s*["'](dialog|alertdialog)["']/);
  if (roleMatch) {
    const insertPos = line.indexOf(roleMatch[0]) + roleMatch[0].length;
    const newLine = line.slice(0, insertPos) + ' aria-label="Dialog"' + line.slice(insertPos);
    lines[targetLine] = newLine;
  } else {
    // Add at the tag level
    const tagMatch = line.match(/<\w+\s/);
    if (!tagMatch) {
      return { success: false, reason: 'Could not find tag on target line.' };
    }
    const insertPos = line.indexOf(tagMatch[0]) + tagMatch[0].length;
    const newLine = line.slice(0, insertPos) + 'aria-label="Dialog" ' + line.slice(insertPos);
    lines[targetLine] = newLine;
  }

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Added aria-label="Dialog" to dialog in ${issue.file} line ${issue.line}. Please update with a descriptive title.` };
}

try {
  const result = applyFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}

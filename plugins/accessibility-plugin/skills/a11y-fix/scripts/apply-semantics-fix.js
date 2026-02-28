#!/usr/bin/env node
/**
 * apply-semantics-fix.js
 * Fixes semantic HTML accessibility issues.
 * Usage: node apply-semantics-fix.js '<issue-json>' [project-root]
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

  // div/span with onClick → replace with <button type="button">
  if (problem.includes('onClick handler used as interactive control')) {
    return fixDivToButton(filePath, content, lines, lineIdx);
  }

  // Missing tabindex on element with role
  if (problem.includes('missing tabindex')) {
    return addTabindex(filePath, content, lines, lineIdx);
  }

  return { success: false, reason: 'This semantics issue requires manual review.' };
}

function fixDivToButton(filePath, content, lines, lineIdx) {
  if (lineIdx < 0 || lineIdx >= lines.length) {
    return { success: false, reason: 'Could not locate the issue line.' };
  }

  const line = lines[lineIdx];
  const tagMatch = line.match(/<(div|span)\s/);
  if (!tagMatch) {
    return { success: false, reason: 'Could not find div/span on target line.' };
  }

  const origTag = tagMatch[1];

  // Safety checks
  const fullTag = line.substring(line.indexOf(tagMatch[0]));
  if (/<(a|button|input|select|textarea)\s/i.test(fullTag)) {
    return { success: false, reason: 'Nested interactive elements detected — cannot safely convert.' };
  }
  if (/\bhref\s*=/.test(fullTag)) {
    return { success: false, reason: 'Element has href — should be a link, not a button.' };
  }

  // Replace opening tag
  let newLine = line.replace(new RegExp(`<${origTag}(\\s)`), '<button type="button"$1');

  // Find and replace closing tag (may be on a different line)
  const closePattern = new RegExp(`</${origTag}>`);
  let closingFixed = false;

  // Check if closing tag is on the same line
  if (closePattern.test(newLine)) {
    newLine = newLine.replace(closePattern, '</button>');
    closingFixed = true;
  }

  lines[lineIdx] = newLine;

  // If closing tag wasn't on the same line, find it below
  if (!closingFixed) {
    for (let i = lineIdx + 1; i < lines.length; i++) {
      if (closePattern.test(lines[i])) {
        lines[i] = lines[i].replace(closePattern, '</button>');
        closingFixed = true;
        break;
      }
    }
  }

  if (!closingFixed) {
    return { success: false, reason: `Could not find closing </${origTag}> tag.` };
  }

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Replaced <${origTag} onClick> with <button type="button"> in ${issue.file} line ${issue.line}.` };
}

function addTabindex(filePath, content, lines, lineIdx) {
  if (lineIdx < 0 || lineIdx >= lines.length) {
    return { success: false, reason: 'Could not locate the issue line.' };
  }

  const line = lines[lineIdx];
  if (/tabindex\s*=/.test(line)) {
    return { success: false, reason: 'Element already has tabindex.' };
  }

  const tagMatch = line.match(/<(div|span)\s/);
  if (!tagMatch) {
    return { success: false, reason: 'Could not find div/span on target line.' };
  }

  const insertPos = line.indexOf(tagMatch[0]) + tagMatch[0].length;
  lines[lineIdx] = line.slice(0, insertPos) + 'tabindex="0" ' + line.slice(insertPos);

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Added tabindex="0" in ${issue.file} line ${issue.line}.` };
}

try {
  const result = applyFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}

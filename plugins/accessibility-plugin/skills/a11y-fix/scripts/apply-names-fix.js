#!/usr/bin/env node
/**
 * apply-names-fix.js
 * Fixes accessible name issues.
 * Usage: node apply-names-fix.js '<issue-json>' [project-root]
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

  const line = lines[lineIdx];

  // Icon-only button or button with no name
  if (problem.includes('button') && problem.includes('accessible name') || problem.includes('Icon-only button')) {
    return addAriaLabelToTag(filePath, content, lines, lineIdx, 'button', 'TODO: label');
  }

  // Self-closing button
  if (problem.includes('Self-closing') && problem.includes('button')) {
    return addAriaLabelToSelfClosing(filePath, content, lines, lineIdx, 'button');
  }

  // Link with no name
  if (problem.includes('Link') && problem.includes('accessible name')) {
    return addAriaLabelToTag(filePath, content, lines, lineIdx, 'a', 'TODO: label');
  }

  // Empty aria-label
  if (problem.includes('Empty aria-label')) {
    return fixEmptyAriaLabel(filePath, content, lines, lineIdx);
  }

  return { success: false, reason: 'This accessible name issue requires manual review.' };
}

function addAriaLabelToTag(filePath, content, lines, lineIdx, tagName, label) {
  const line = lines[lineIdx];
  const pattern = new RegExp(`<${tagName}\\s`);
  const match = pattern.exec(line);
  if (!match) {
    return { success: false, reason: `Could not find <${tagName}> on target line.` };
  }

  // Check if already has non-empty aria-label
  const tagStart = match.index;
  const tagEnd = line.indexOf('>', tagStart);
  const tag = line.substring(tagStart, tagEnd + 1);
  if (/aria-label\s*=\s*["'][^"']+["']/.test(tag)) {
    return { success: false, reason: `<${tagName}> already has an aria-label.` };
  }

  const insertPos = match.index + match[0].length;
  lines[lineIdx] = line.slice(0, insertPos) + `aria-label="${label}" ` + line.slice(insertPos);

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Added aria-label="${label}" to <${tagName}> in ${issue.file} line ${issue.line}. Please update with a descriptive label.` };
}

function addAriaLabelToSelfClosing(filePath, content, lines, lineIdx, tagName) {
  const line = lines[lineIdx];
  const pattern = new RegExp(`<${tagName}\\s([^>]*?)/>`);
  const match = pattern.exec(line);
  if (!match) {
    return { success: false, reason: `Could not find self-closing <${tagName} /> on target line.` };
  }

  if (/aria-label\s*=\s*["'][^"']+["']/.test(match[1])) {
    return { success: false, reason: `<${tagName} /> already has an aria-label.` };
  }

  const newTag = match[0].replace(`/>`, `aria-label="TODO: label" />`);
  lines[lineIdx] = line.replace(match[0], newTag);

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Added aria-label="TODO: label" to <${tagName} /> in ${issue.file} line ${issue.line}. Please update with a descriptive label.` };
}

function fixEmptyAriaLabel(filePath, content, lines, lineIdx) {
  const line = lines[lineIdx];
  const emptyPattern = /aria-label\s*=\s*["']\s*["']/;
  if (!emptyPattern.test(line)) {
    return { success: false, reason: 'Empty aria-label not found on target line.' };
  }

  // Check if element has visible text (look for text content between tags)
  const tagStart = line.lastIndexOf('<', line.search(emptyPattern));
  const afterTag = content.substring(content.indexOf(line) + line.indexOf('>') + 1);
  const closeMatch = afterTag.match(/^([^<]*)</);
  const hasVisibleText = closeMatch && closeMatch[1].trim().length > 0;

  let newLine;
  if (hasVisibleText) {
    // Remove empty aria-label — visible text provides the name
    newLine = line.replace(/\s*aria-label\s*=\s*["']\s*["']/, '');
  } else {
    // Replace with TODO
    newLine = line.replace(emptyPattern, 'aria-label="TODO: label"');
  }

  lines[lineIdx] = newLine;

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  const action = hasVisibleText
    ? `Removed empty aria-label (visible text provides the name) in ${issue.file} line ${issue.line}.`
    : `Replaced empty aria-label with "TODO: label" in ${issue.file} line ${issue.line}. Please update.`;

  return { success: true, action };
}

try {
  const result = applyFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}
